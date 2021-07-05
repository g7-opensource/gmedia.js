export const GPlayerEvent = {
    ERROR: 'error',
    MEDIA_SOURCE_END: 'media_source_end',
    TIMEUPDATE: 'timeupdate',
    STATISTICS_INFO: 'statistics_info',
    MEDIA_STATE: 'media_state',
    PLAYBACK_CONTROL_EVENT: 'playback_control_event',
};

export const GErrorType = {
    NETWORK_ERROR: 'NetworkError',
    MEDIA_ERROR: 'MediaError',
    OTHER_ERROR: 'OtherError'
};

export const GPlaybackControlStatus = {
    SeekStart: 0,
    SeekFail: 1,
    SeekSuccess: 2
};
