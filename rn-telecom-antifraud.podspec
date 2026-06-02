require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "rn-telecom-antifraud"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["repository"]["url"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/AbdurakhmonZiyodov/rn-telecom-antifraud.git", :tag => "v#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.swift_version = "5.0"

  # Telecom AntiFraud native SDK (TBM/RTMC). Distributed on CocoaPods as AntiFraudMobile.
  s.dependency "AntiFraudMobile", "~> 1.1.4"

  # Fabric / TurboModule wiring — pulls in React-Core, React-Codegen, etc.
  install_modules_dependencies(s)
end
