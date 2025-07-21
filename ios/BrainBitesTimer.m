#import "BrainBitesTimer.h"

@implementation BrainBitesTimer
{
    NSTimer *_timer;
    NSInteger _remainingTime;
    NSInteger _debtTime;
    BOOL _isTracking;
    BOOL _hasListeners;
}

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents {
    return @[@"timerUpdate"];
}

- (void)startObserving {
    _hasListeners = YES;
}

- (void)stopObserving {
    _hasListeners = NO;
}

RCT_EXPORT_METHOD(startListening) {
    [self startTimer];
}

RCT_EXPORT_METHOD(startTracking) {
    _isTracking = YES;
    [self startTimer];
}

RCT_EXPORT_METHOD(stopTracking) {
    _isTracking = NO;
    [_timer invalidate];
    _timer = nil;
}

RCT_EXPORT_METHOD(getRemainingTime:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@{
        @"remainingTime": @(_remainingTime),
        @"debtTime": @(_debtTime)
    });
}

RCT_EXPORT_METHOD(addTime:(NSInteger)seconds) {
    _remainingTime += seconds;
    if (_remainingTime > 0 && _debtTime > 0) {
        NSInteger payoff = MIN(_remainingTime, _debtTime);
        _debtTime -= payoff;
        _remainingTime -= payoff;
    }
    [self sendUpdate];
}

RCT_EXPORT_METHOD(notifyAppState:(NSString *)state) {
    // Handle app state
}

- (void)startTimer {
    if (_timer) {
        [_timer invalidate];
    }
    
    _timer = [NSTimer scheduledTimerWithTimeInterval:1.0
                                              target:self
                                            selector:@selector(timerTick)
                                            userInfo:nil
                                             repeats:YES];
}

- (void)timerTick {
    if (_isTracking && _remainingTime > 0) {
        _remainingTime--;
    } else if (_isTracking && _remainingTime <= 0) {
        _debtTime++;
    }
    [self sendUpdate];
}

- (void)sendUpdate {
    if (_hasListeners) {
        [self sendEventWithName:@"timerUpdate" body:@{
            @"remainingTime": @(_remainingTime),
            @"isTracking": @(_isTracking),
            @"debtTime": @(_debtTime),
            @"isAppForeground": @(YES)
        }];
    }
}

@end 