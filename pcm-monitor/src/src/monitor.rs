use ebur128::EbuR128;
use napi_derive::napi;
use std::sync::{Arc, Mutex};

use crate::channel::Channel;

#[napi]
pub struct PCMMonitor {
    inner: Arc<Mutex<EbuR128>>,
}

#[napi]
impl PCMMonitor {
    #[napi]
    pub fn new(channels: Vec<Channel>, sample_rate: u32) -> napi::Result<PCMMonitor> {
        if channels.is_empty() {
            return Err(napi::Error::from_reason("Specify at least one channel."));
        }

        // convert napi enum --> ebur128 enum
        let channels: Vec<ebur128::Channel> = channels.into_iter().map(Channel::into).collect();

        let mode: ebur128::Mode = ebur128::Mode::I
            | ebur128::Mode::M
            | ebur128::Mode::S
            | ebur128::Mode::LRA
            | ebur128::Mode::TRUE_PEAK;

        let mut monitor = EbuR128::new(channels.len() as u32, sample_rate, mode).map_err(|e| {
            napi::Error::from_reason(format!("Failed to create EBU R 128 monitor: {e}"))
        })?;

        monitor
            .set_channel_map(&channels)
            .map_err(|e| napi::Error::from_reason(format!("Failed to set channel map: {e}")))?;

        Ok(PCMMonitor {
            inner: Arc::new(Mutex::new(monitor)),
        })
    }

    #[napi]
    pub fn add_samples(&self, samples: &[f64]) -> napi::Result<()> {
        let mut monitor = self.inner.lock().unwrap();
        monitor
            .add_frames_f64(samples)
            .map_err(|e| napi::Error::from_reason(format!("Failed to add samples: {e}")))?;
        Ok(())
    }

    #[napi]
    pub fn get_stats(&self) -> napi::Result<PCMStats> {
        let monitor = self.inner.lock().unwrap();

        let m_lufs = monitor.loudness_momentary().map_err(|e| {
            napi::Error::from_reason(format!("Failed to get momentary loudness: {e}"))
        })?;
        let s_lufs = monitor.loudness_shortterm().map_err(|e| {
            napi::Error::from_reason(format!("Failed to get short-term loudness: {e}"))
        })?;
        let i_lufs = monitor.loudness_global().map_err(|e| {
            napi::Error::from_reason(format!("Failed to get integrated loudness: {e}"))
        })?;
        let lra_lu = monitor
            .loudness_range()
            .map_err(|e| napi::Error::from_reason(format!("Failed to get loudness range: {e}")))?;

        let num_channels = monitor.channels();
        let mut peaks_dbfs = Vec::with_capacity(num_channels as usize);
        let mut true_peaks_dbtp = Vec::with_capacity(num_channels as usize);

        for ch in 0..num_channels {
            peaks_dbfs.push(percent_fs_to_db(monitor.sample_peak(ch).map_err(|e| {
                napi::Error::from_reason(format!("Failed to get sample peak for channel {ch}: {e}"))
            })?));
            true_peaks_dbtp.push(percent_fs_to_db(monitor.true_peak(ch).map_err(|e| {
                napi::Error::from_reason(format!("Failed to get true peak for channel {ch}: {e}"))
            })?));
        }

        Ok(PCMStats {
            m_lufs,
            s_lufs,
            i_lufs,
            lra_lu,
            peaks_dbfs,
            true_peaks_dbtp,
        })
    }

    #[napi]
    pub fn reset_peaks(&self) {
        let mut monitor = self.inner.lock().unwrap();
        monitor.reset_peaks();
    }
}

#[napi]
pub struct PCMStats {
    pub m_lufs: f64,
    pub s_lufs: f64,
    pub i_lufs: f64,
    pub lra_lu: f64,
    pub peaks_dbfs: Vec<f64>,
    pub true_peaks_dbtp: Vec<f64>,
}

fn percent_fs_to_db(percent_fs: f64) -> f64 {
    20f64 * f64::log10(percent_fs)
}
