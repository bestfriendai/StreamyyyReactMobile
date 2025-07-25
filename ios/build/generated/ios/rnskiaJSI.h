/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * @generated by codegen project: GenerateModuleH.js
 */

#pragma once

#include <ReactCommon/TurboModule.h>
#include <react/bridging/Bridging.h>

namespace facebook::react {


  class JSI_EXPORT NativeSkiaModuleCxxSpecJSI : public TurboModule {
protected:
  NativeSkiaModuleCxxSpecJSI(std::shared_ptr<CallInvoker> jsInvoker);

public:
  virtual bool install(jsi::Runtime &rt) = 0;

};

template <typename T>
class JSI_EXPORT NativeSkiaModuleCxxSpec : public TurboModule {
public:
  jsi::Value create(jsi::Runtime &rt, const jsi::PropNameID &propName) override {
    return delegate_.create(rt, propName);
  }

  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& runtime) override {
    return delegate_.getPropertyNames(runtime);
  }

  static constexpr std::string_view kModuleName = "RNSkiaModule";

protected:
  NativeSkiaModuleCxxSpec(std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule(std::string{NativeSkiaModuleCxxSpec::kModuleName}, jsInvoker),
      delegate_(reinterpret_cast<T*>(this), jsInvoker) {}


private:
  class Delegate : public NativeSkiaModuleCxxSpecJSI {
  public:
    Delegate(T *instance, std::shared_ptr<CallInvoker> jsInvoker) :
      NativeSkiaModuleCxxSpecJSI(std::move(jsInvoker)), instance_(instance) {

    }

    bool install(jsi::Runtime &rt) override {
      static_assert(
          bridging::getParameterCount(&T::install) == 1,
          "Expected install(...) to have 1 parameters");

      return bridging::callFromJs<bool>(
          rt, &T::install, jsInvoker_, instance_);
    }

  private:
    friend class NativeSkiaModuleCxxSpec;
    T *instance_;
  };

  Delegate delegate_;
};

} // namespace facebook::react
