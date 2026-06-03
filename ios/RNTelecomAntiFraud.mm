#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNTelecomAntiFraud, NSObject)

// Initialize the AntiFraud library with host (pins = SHA-256 SSL pins, applied before init)
RCT_EXTERN_METHOD(initialize:(NSString *)host
                  pins:(NSArray *)pins
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Check if library is initialized
RCT_EXTERN_METHOD(isInitialized:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Configure SSL pinning (call after initialize; cert rotation)
RCT_EXTERN_METHOD(setSslPinning:(NSArray *)pins
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Clear SSL pinning
RCT_EXTERN_METHOD(clearSslPinning:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Verify SMS code
RCT_EXTERN_METHOD(verifySmsCode:(NSString *)phoneNumber
                  smsCode:(NSString *)smsCode
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Confirm face verification
RCT_EXTERN_METHOD(confirmFace:(NSString *)birthDate
                  document:(NSString *)document
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Make operation (update session)
RCT_EXTERN_METHOD(makeOperation:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Detect fraud
RCT_EXTERN_METHOD(detectFraud:(NSString *)smsCode
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Logout user
RCT_EXTERN_METHOD(logout:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Get application/client instance ID
RCT_EXTERN_METHOD(getApplicationId:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
