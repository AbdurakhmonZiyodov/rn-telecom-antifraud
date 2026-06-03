import Foundation
import React
import AntiFraud_Mobile_SDK

@objc(RNTelecomAntiFraud)
class RNTelecomAntiFraud: NSObject {

  private var library: AntiFraudLibrary?

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc(initialize:pins:resolver:rejecter:)
  func initialize(_ host: String,
                  pins: [String],
                  resolver: @escaping RCTPromiseResolveBlock,
                  rejecter: @escaping RCTPromiseRejectBlock) {
    let lib = AntiFraudLibrary(host: host)
    library = lib

    // Apply SSL pinning BEFORE initialization() so the SDK's network client is built with the
    // pins active. Setting pins AFTER init does not re-configure the already-built client.
    if !pins.isEmpty {
      lib.setSslPinning(pins: pins)
    }

    lib.initialization { result in
      switch result {
      case .success:
        resolver("TelecomAntiFraud initialized successfully")
      case .failure(let error):
        rejecter("INIT_ERROR", "Failed to initialize TelecomAntiFraud: \(error)", error)
      }
    }
  }

  @objc(isInitialized:rejecter:)
  func isInitialized(_ resolver: @escaping RCTPromiseResolveBlock,
                     rejecter: @escaping RCTPromiseRejectBlock) {
    guard let library = library else {
      rejecter("LIBRARY_ERROR", "Library not initialized", nil)
      return
    }
    resolver(library.isInitialized())
  }

  @objc(setSslPinning:resolver:rejecter:)
  func setSslPinning(_ pins: [String],
                     resolver: @escaping RCTPromiseResolveBlock,
                     rejecter: @escaping RCTPromiseRejectBlock) {
    guard let library = library else {
      rejecter("LIBRARY_ERROR", "Library not initialized", nil)
      return
    }
    library.setSslPinning(pins: pins)
    resolver("SSL pinning configured")
  }

  @objc(clearSslPinning:rejecter:)
  func clearSslPinning(_ resolver: @escaping RCTPromiseResolveBlock,
                       rejecter: @escaping RCTPromiseRejectBlock) {
    guard let library = library else {
      rejecter("LIBRARY_ERROR", "Library not initialized", nil)
      return
    }
    library.clearSslPinning()
    resolver("SSL pinning cleared")
  }

  @objc(verifySmsCode:smsCode:resolver:rejecter:)
  func verifySmsCode(_ phoneNumber: String,
                     smsCode: String,
                     resolver: @escaping RCTPromiseResolveBlock,
                     rejecter: @escaping RCTPromiseRejectBlock) {
    guard let library = library else {
      rejecter("LIBRARY_ERROR", "Library not initialized", nil)
      return
    }
    library.verifySmsCode(phoneNumber: phoneNumber, smsCode: smsCode) { result in
      switch result {
      case .success:
        resolver("SMS code verified successfully")
      case .failure(let error):
        rejecter("SMS_VERIFY_ERROR", "Failed to verify SMS code: \(error)", error)
      }
    }
  }

  @objc(confirmFace:document:resolver:rejecter:)
  func confirmFace(_ birthDate: String,
                   document: String,
                   resolver: @escaping RCTPromiseResolveBlock,
                   rejecter: @escaping RCTPromiseRejectBlock) {
    guard let library = library else {
      rejecter("LIBRARY_ERROR", "Library not initialized", nil)
      return
    }
    library.confirmFace(birthDate: birthDate, document: document) { result in
      switch result {
      case .success:
        resolver("Face confirmed successfully")
      case .failure(let error):
        rejecter("FACE_CONFIRM_ERROR", "Failed to confirm face: \(error)", error)
      }
    }
  }

  @objc(makeOperation:rejecter:)
  func makeOperation(_ resolver: @escaping RCTPromiseResolveBlock,
                     rejecter: @escaping RCTPromiseRejectBlock) {
    guard let library = library else {
      rejecter("LIBRARY_ERROR", "Library not initialized", nil)
      return
    }
    library.makeOperation { result in
      switch result {
      case .success:
        resolver("Session updated successfully")
      case .failure(let error):
        rejecter("OPERATION_ERROR", "Failed to make operation: \(error)", error)
      }
    }
  }

  @objc(detectFraud:resolver:rejecter:)
  func detectFraud(_ smsCode: String,
                   resolver: @escaping RCTPromiseResolveBlock,
                   rejecter: @escaping RCTPromiseRejectBlock) {
    guard let library = library else {
      rejecter("LIBRARY_ERROR", "Library not initialized", nil)
      return
    }
    library.detectFraud(smsCode: smsCode) { result in
      switch result {
      case .success:
        resolver("Transaction verified successfully")
      case .failure(let error):
        rejecter("FRAUD_DETECT_ERROR", "Failed to detect fraud: \(error)", error)
      }
    }
  }

  @objc(logout:rejecter:)
  func logout(_ resolver: @escaping RCTPromiseResolveBlock,
              rejecter: @escaping RCTPromiseRejectBlock) {
    guard let library = library else {
      rejecter("LIBRARY_ERROR", "Library not initialized", nil)
      return
    }
    library.logout { result in
      switch result {
      case .success:
        resolver("Logged out successfully")
      case .failure(let error):
        rejecter("LOGOUT_ERROR", "Failed to logout: \(error)", error)
      }
    }
  }

  @objc(getApplicationId:rejecter:)
  func getApplicationId(_ resolver: @escaping RCTPromiseResolveBlock,
                        rejecter: @escaping RCTPromiseRejectBlock) {
    guard let library = library else {
      rejecter("LIBRARY_ERROR", "Library not initialized", nil)
      return
    }
    do {
      let applicationId = try library.getClientInstanceId()
      resolver(applicationId)
    } catch {
      rejecter("APP_ID_ERROR", "Failed to get application ID: \(error)", error)
    }
  }
}
