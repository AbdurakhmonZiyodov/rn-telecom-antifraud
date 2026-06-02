package com.rntelecomantifraud

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import uz.tbm.antifraudmobilesdk.AntiFraudLibrary

class RNTelecomAntiFraudModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private var library: AntiFraudLibrary? = null

    override fun getName(): String = "RNTelecomAntiFraud"

    @ReactMethod
    fun initialize(host: String, promise: Promise) {
        try {
            library = AntiFraudLibrary(host, reactApplicationContext)
            library?.initialize { result ->
                result.fold(
                    onSuccess = { promise.resolve("TelecomAntiFraud initialized successfully") },
                    onFailure = { error -> promise.reject("INIT_ERROR", error.message, error) }
                )
            }
        } catch (e: Exception) {
            promise.reject("INIT_EXCEPTION", e.message, e)
        }
    }

    @ReactMethod
    fun isInitialized(promise: Promise) {
        promise.resolve(library?.isInitialized() ?: false)
    }

    private fun applySslPins(lib: AntiFraudLibrary, pins: ReadableArray?) {
        if (pins == null || pins.size() == 0) return
        val set = HashSet<String>()
        for (i in 0 until pins.size()) {
            pins.getString(i)?.let { set.add(it) }
        }
        if (set.isNotEmpty()) lib.setSslPinning(set)
    }

    @ReactMethod
    fun setSslPinning(pins: ReadableArray, promise: Promise) {
        val lib = library
        if (lib == null) {
            promise.reject("LIBRARY_ERROR", "Library not initialized")
            return
        }
        try {
            applySslPins(lib, pins)
            promise.resolve("SSL pinning configured")
        } catch (e: Exception) {
            promise.reject("SSL_PINNING_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun clearSslPinning(promise: Promise) {
        val lib = library
        if (lib == null) {
            promise.reject("LIBRARY_ERROR", "Library not initialized")
            return
        }
        try {
            lib.clearSslPinning()
            promise.resolve("SSL pinning cleared")
        } catch (e: Exception) {
            promise.reject("SSL_PINNING_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun verifySmsCode(phoneNumber: String, smsCode: String, promise: Promise) {
        library?.verifySmsCode(phoneNumber, smsCode) { result ->
            result.fold(
                onSuccess = { promise.resolve("SMS code verified successfully") },
                onFailure = { error -> promise.reject("SMS_VERIFY_ERROR", error.message, error) }
            )
        } ?: promise.reject("LIBRARY_ERROR", "Library not initialized")
    }

    @ReactMethod
    fun confirmFace(birthDate: String, document: String, promise: Promise) {
        library?.confirmFace(document, birthDate) { result ->
            result.fold(
                onSuccess = { promise.resolve("Face confirmed successfully") },
                onFailure = { error -> promise.reject("FACE_CONFIRM_ERROR", error.message, error) }
            )
        } ?: promise.reject("LIBRARY_ERROR", "Library not initialized")
    }

    @ReactMethod
    fun makeOperation(promise: Promise) {
        library?.makeOperation { result ->
            result.fold(
                onSuccess = { promise.resolve("Session updated successfully") },
                onFailure = { error -> promise.reject("OPERATION_ERROR", error.message, error) }
            )
        } ?: promise.reject("LIBRARY_ERROR", "Library not initialized")
    }

    @ReactMethod
    fun detectFraud(code: String, promise: Promise) {
        library?.detectFraud(code) { result ->
            result.fold(
                onSuccess = { promise.resolve("Transaction verified successfully") },
                onFailure = { error -> promise.reject("FRAUD_DETECT_ERROR", error.message, error) }
            )
        } ?: promise.reject("LIBRARY_ERROR", "Library not initialized")
    }

    @ReactMethod
    fun logout(promise: Promise) {
        library?.logout { result ->
            result.fold(
                onSuccess = { promise.resolve("Logged out successfully") },
                onFailure = { error -> promise.reject("LOGOUT_ERROR", error.message, error) }
            )
        } ?: promise.reject("LIBRARY_ERROR", "Library not initialized")
    }

    @ReactMethod
    fun getApplicationId(promise: Promise) {
        library?.getClientInstanceId { result ->
            result.fold(
                onSuccess = { id -> promise.resolve(id) },
                onFailure = { error -> promise.reject("APP_ID_ERROR", error.message, error) }
            )
        } ?: promise.reject("LIBRARY_ERROR", "Library not initialized")
    }
}
