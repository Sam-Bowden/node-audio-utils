use napi_derive::napi;

#[napi]
pub enum Channel {
    Unused,
    Left,
    Right,
    Center,
    LeftSurround,
    RightSurround,
}
impl From<Channel> for ebur128::Channel {
    fn from(channel: Channel) -> ebur128::Channel {
        match channel {
            Channel::Unused => ebur128::Channel::Unused,
            Channel::Left => ebur128::Channel::Left,
            Channel::Right => ebur128::Channel::Right,
            Channel::Center => ebur128::Channel::Center,
            Channel::LeftSurround => ebur128::Channel::LeftSurround,
            Channel::RightSurround => ebur128::Channel::RightSurround,
        }
    }
}
