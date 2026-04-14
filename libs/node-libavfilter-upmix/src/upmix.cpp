#include <napi.h>
extern "C" {
#include <libavfilter/avfilter.h>
#include <libavfilter/buffersink.h>
#include <libavfilter/buffersrc.h>
#include <libavutil/channel_layout.h>
#include <libavutil/error.h>
#include <libavutil/frame.h>
#include <libavutil/opt.h>
#include <libavutil/samplefmt.h>
}

#include <cstring>
#include <sstream>
#include <stdexcept>
#include <string>

static std::string avErr(int errnum) {
    char buf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(errnum, buf, sizeof(buf));
    return std::string(buf);
}

class Upmix : public Napi::ObjectWrap<Upmix> {
  public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func =
            DefineClass(env, "Upmix",
                        {
                            InstanceMethod("process", &Upmix::Process),
                            InstanceMethod("flush", &Upmix::Flush),
                            InstanceMethod("close", &Upmix::Close),
                            InstanceMethod("reset", &Upmix::Reset),
                        });
        exports.Set("Upmix", func);
        return exports;
    }

    Upmix(const Napi::CallbackInfo &info) : Napi::ObjectWrap<Upmix>(info) {
        Napi::Env env = info.Env();

        if (info.Length() < 1 || !info[0].IsObject()) {
            Napi::TypeError::New(env, "Options object required")
                .ThrowAsJavaScriptException();
            return;
        }

        Napi::Object opts = info[0].As<Napi::Object>();

        sampleRate_ = opts.Get("sampleRate").As<Napi::Number>().Int32Value();
        bitDepth_ = opts.Get("bitDepth").As<Napi::Number>().Int32Value();
        inputLayout_ = opts.Get("inputLayout").As<Napi::String>().Utf8Value();
        outputLayout_ = opts.Get("outputLayout").As<Napi::String>().Utf8Value();
        winSize_ = opts.Get("winSize").As<Napi::Number>().Int32Value();

        if (bitDepth_ != 16 && bitDepth_ != 32) {
            Napi::RangeError::New(env, "bitDepth must be 16 or 32")
                .ThrowAsJavaScriptException();
            return;
        }

        try {
            buildGraph(inputLayout_, outputLayout_, winSize_);
        } catch (const std::exception &e) {
            Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        }
    }

    ~Upmix() { freeGraph(); }

  private:
    AVFilterGraph *graph_ = nullptr;
    AVFilterContext *srcCtx_ = nullptr;
    AVFilterContext *sinkCtx_ = nullptr;

    int sampleRate_ = 48000;
    int bitDepth_ = 16;
    int inChannels_ = 2;
    int64_t ptsCounter_ = 0;
    std::string inputLayout_;
    std::string outputLayout_;
    int winSize_ = 4096;

    void freeGraph() {
        if (graph_ != nullptr) {
            avfilter_graph_free(&graph_);
            graph_ = nullptr;
            srcCtx_ = nullptr;
            sinkCtx_ = nullptr;
        }
    }

    void buildGraph(const std::string &inputLayout,
                    const std::string &outputLayout, int winSize) {
        int ret;

        // Parse input layout to get channel count
        AVChannelLayout inLayout = {};
        ret = av_channel_layout_from_string(&inLayout, inputLayout.c_str());
        if (ret < 0)
            throw std::runtime_error("Invalid inputLayout '" + inputLayout +
                                     "': " + avErr(ret));
        inChannels_ = inLayout.nb_channels;
        av_channel_layout_uninit(&inLayout);

        // Validate output layout
        AVChannelLayout outLayout = {};
        ret = av_channel_layout_from_string(&outLayout, outputLayout.c_str());
        if (ret < 0)
            throw std::runtime_error("Invalid outputLayout '" + outputLayout +
                                     "': " + avErr(ret));
        av_channel_layout_uninit(&outLayout);

        graph_ = avfilter_graph_alloc();
        if (graph_ == nullptr)
            throw std::runtime_error("Failed to allocate filter graph");

        // --- abuffer ---
        const AVFilter *abuffer = avfilter_get_by_name("abuffer");
        if (abuffer == nullptr) {
            freeGraph();
            throw std::runtime_error("abuffer filter not found");
        }

        std::ostringstream bufArgs;
        bufArgs << "sample_rate=" << sampleRate_ << ":sample_fmt=fltp"
                << ":channel_layout=" << inputLayout << ":time_base=1/"
                << sampleRate_;

        ret = avfilter_graph_create_filter(
            &srcCtx_, abuffer, "in", bufArgs.str().c_str(), nullptr, graph_);
        if (ret < 0) {
            freeGraph();
            throw std::runtime_error("Failed to create abuffer: " + avErr(ret));
        }

        // --- surround ---
        const AVFilter *surround = avfilter_get_by_name("surround");
        if (surround == nullptr) {
            freeGraph();
            throw std::runtime_error("surround filter not found");
        }

        std::ostringstream surroundArgs;
        surroundArgs << "chl_out=" << outputLayout << ":chl_in=" << inputLayout
                     << ":win_size=" << winSize;

        AVFilterContext *surroundCtx = nullptr;
        ret = avfilter_graph_create_filter(&surroundCtx, surround, "surround",
                                           surroundArgs.str().c_str(), nullptr,
                                           graph_);
        if (ret < 0) {
            freeGraph();
            throw std::runtime_error("Failed to create surround filter: " +
                                     avErr(ret));
        }

        // --- abuffersink ---
        const AVFilter *abuffersink = avfilter_get_by_name("abuffersink");
        if (abuffersink == nullptr) {
            freeGraph();
            throw std::runtime_error("abuffersink filter not found");
        }

        ret = avfilter_graph_create_filter(&sinkCtx_, abuffersink, "out",
                                           nullptr, nullptr, graph_);
        if (ret < 0) {
            freeGraph();
            throw std::runtime_error("Failed to create abuffersink: " +
                                     avErr(ret));
        }

        // --- link ---
        ret = avfilter_link(srcCtx_, 0, surroundCtx, 0);
        if (ret < 0) {
            freeGraph();
            throw std::runtime_error("Failed to link abuffer→surround: " +
                                     avErr(ret));
        }

        ret = avfilter_link(surroundCtx, 0, sinkCtx_, 0);
        if (ret < 0) {
            freeGraph();
            throw std::runtime_error("Failed to link surround→abuffersink: " +
                                     avErr(ret));
        }

        ret = avfilter_graph_config(graph_, nullptr);
        if (ret < 0) {
            freeGraph();
            throw std::runtime_error("Failed to configure filter graph: " +
                                     avErr(ret));
        }
    }

    // Deinterleave and normalise to FLTP
    AVFrame *toFLTP(const uint8_t *data, size_t byteLen) {
        int bytesPerSample = bitDepth_ / 8;
        int nbSamples = static_cast<int>(
            byteLen / (static_cast<size_t>(inChannels_) * bytesPerSample));

        AVFrame *frame = av_frame_alloc();
        if (frame == nullptr)
            throw std::runtime_error("Failed to allocate input AVFrame");

        frame->format = AV_SAMPLE_FMT_FLTP;
        frame->sample_rate = sampleRate_;
        frame->nb_samples = nbSamples;
        frame->pts = ptsCounter_;
        av_channel_layout_default(&frame->ch_layout, inChannels_);

        int ret = av_frame_get_buffer(frame, 0);
        if (ret < 0) {
            av_frame_free(&frame);
            throw std::runtime_error("Failed to allocate frame buffer: " +
                                     avErr(ret));
        }

        if (bitDepth_ == 16) {
            const int16_t *src = reinterpret_cast<const int16_t *>(data);
            for (int s = 0; s < nbSamples; ++s) {
                for (int ch = 0; ch < inChannels_; ++ch) {
                    reinterpret_cast<float *>(frame->data[ch])[s] =
                        static_cast<float>(src[s * inChannels_ + ch]) /
                        32768.0f;
                }
            }
        } else {
            const int32_t *src = reinterpret_cast<const int32_t *>(data);
            for (int s = 0; s < nbSamples; ++s) {
                for (int ch = 0; ch < inChannels_; ++ch) {
                    reinterpret_cast<float *>(frame->data[ch])[s] =
                        static_cast<float>(src[s * inChannels_ + ch]) /
                        2147483648.0f;
                }
            }
        }

        ptsCounter_ += nbSamples;
        return frame;
    }

    // Interleave and scale FLTP back to integer PCM
    std::vector<uint8_t> fromFLTP(AVFrame *frame) {
        int channels = frame->ch_layout.nb_channels;
        int nbSamples = frame->nb_samples;
        int bytesPerSample = bitDepth_ / 8;

        std::vector<uint8_t> out(static_cast<size_t>(nbSamples) * channels *
                                 bytesPerSample);

        if (bitDepth_ == 16) {
            int16_t *dst = reinterpret_cast<int16_t *>(out.data());
            for (int s = 0; s < nbSamples; ++s) {
                for (int ch = 0; ch < channels; ++ch) {
                    float val =
                        reinterpret_cast<const float *>(frame->data[ch])[s] *
                        32767.0f;
                    if (val > 32767.0f)
                        val = 32767.0f;
                    if (val < -32768.0f)
                        val = -32768.0f;
                    dst[s * channels + ch] = static_cast<int16_t>(val);
                }
            }
        } else {
            int32_t *dst = reinterpret_cast<int32_t *>(out.data());
            for (int s = 0; s < nbSamples; ++s) {
                for (int ch = 0; ch < channels; ++ch) {
                    float val =
                        reinterpret_cast<const float *>(frame->data[ch])[s] *
                        2147483647.0f;
                    if (val > 2147483647.0f)
                        val = 2147483647.0f;
                    if (val < -2147483648.0f)
                        val = -2147483648.0f;
                    dst[s * channels + ch] = static_cast<int32_t>(val);
                }
            }
        }

        return out;
    }

    // Pull all available frames from the sink into a flat byte vector
    std::vector<uint8_t> drainSink() {
        std::vector<uint8_t> result;

        AVFrame *outFrame = av_frame_alloc();
        if (outFrame == nullptr)
            throw std::runtime_error("Failed to allocate output AVFrame");

        while (true) {
            int ret = av_buffersink_get_frame(sinkCtx_, outFrame);
            if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF)
                break;
            if (ret < 0) {
                av_frame_free(&outFrame);
                throw std::runtime_error("Error reading from buffersink: " +
                                         avErr(ret));
            }

            auto chunk = fromFLTP(outFrame);
            result.insert(result.end(), chunk.begin(), chunk.end());
            av_frame_unref(outFrame);
        }

        av_frame_free(&outFrame);
        return result;
    }

    Napi::Value Process(const Napi::CallbackInfo &info) {
        Napi::Env env = info.Env();

        if (graph_ == nullptr) {
            Napi::Error::New(env, "Upmix is closed")
                .ThrowAsJavaScriptException();
            return env.Undefined();
        }

        if (info.Length() < 1 || !info[0].IsBuffer()) {
            Napi::TypeError::New(env, "Buffer argument required")
                .ThrowAsJavaScriptException();
            return env.Undefined();
        }

        Napi::Buffer<uint8_t> input = info[0].As<Napi::Buffer<uint8_t>>();

        if (input.ByteLength() == 0) {
            return Napi::Buffer<uint8_t>::New(env, 0);
        }

        try {
            AVFrame *frame = toFLTP(input.Data(), input.ByteLength());
            int ret = av_buffersrc_add_frame_flags(srcCtx_, frame,
                                                   AV_BUFFERSRC_FLAG_PUSH);
            av_frame_free(&frame);
            if (ret < 0)
                throw std::runtime_error(
                    "Failed to push frame to filter graph: " + avErr(ret));

            auto output = drainSink();
            return Napi::Buffer<uint8_t>::Copy(env, output.data(),
                                               output.size());
        } catch (const std::exception &e) {
            Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
            return env.Undefined();
        }
    }

    Napi::Value Flush(const Napi::CallbackInfo &info) {
        Napi::Env env = info.Env();

        if (graph_ == nullptr) {
            return Napi::Buffer<uint8_t>::New(env, 0);
        }

        try {
            // Signal end-of-stream to the source
            int ret = av_buffersrc_close(srcCtx_, ptsCounter_,
                                         AV_BUFFERSRC_FLAG_PUSH);
            if (ret < 0 && ret != AVERROR_EOF)
                throw std::runtime_error("Failed to close buffer source: " +
                                         avErr(ret));

            auto output = drainSink();
            return Napi::Buffer<uint8_t>::Copy(env, output.data(),
                                               output.size());
        } catch (const std::exception &e) {
            Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
            return env.Undefined();
        }
    }

    void Close(const Napi::CallbackInfo & /* info */) { freeGraph(); }

    Napi::Value Reset(const Napi::CallbackInfo &info) {
        Napi::Env env = info.Env();
        try {
            freeGraph();
            ptsCounter_ = 0;
            buildGraph(inputLayout_, outputLayout_, winSize_);
        } catch (const std::exception &e) {
            Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        }
        return env.Undefined();
    }
};

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    return Upmix::Init(env, exports);
}

NODE_API_MODULE(upmix, Init)
