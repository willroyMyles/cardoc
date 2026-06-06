const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const FILEUTILS_REQUIRE = "require 'fileutils'";
const GRPC_HELPER_NAME = "fix_grpc_core_modulemap!";
const FIREBASE_AUTH_HELPER_NAME = "patch_firebase_auth_swift_header_import!";
const FIREBASE_SWIFT_HEADER_PATHS_HELPER_NAME =
  "add_firebase_swift_compatibility_header_paths!";
const FIREBASE_LINK_HELPER_NAME =
  "remove_firebase_firestore_internal_framework_link!";
const FIREBASE_MODULAR_HEADERS = [
  "  pod 'FirebaseAppCheckInterop', :modular_headers => true",
  "  pod 'FirebaseAuthInterop', :modular_headers => true",
  "  pod 'FirebaseFirestoreInternal', :modular_headers => true",
  "  pod 'GoogleUtilities', :modular_headers => true",
  "  pod 'RecaptchaInterop', :modular_headers => true",
];
const GRPC_HELPER = `
def fix_grpc_core_modulemap!(installer)
  pods_root = installer.sandbox.root.to_s
  grpc_modulemap = File.join(pods_root, 'Target Support Files', 'gRPC-Core', 'gRPC-Core.modulemap')
  expected_dir = File.join(pods_root, 'Headers', 'Private', 'grpc')
  expected_modulemap = File.join(expected_dir, 'gRPC-Core.modulemap')

  return unless File.file?(grpc_modulemap)

  FileUtils.mkdir_p(expected_dir)
  FileUtils.rm_f(expected_modulemap) if File.exist?(expected_modulemap) || File.symlink?(expected_modulemap)
  FileUtils.ln_s(grpc_modulemap, expected_modulemap)
end
`.trim();
const FIREBASE_AUTH_HELPER = `
def patch_firebase_auth_swift_header_import!(installer)
  firebase_header = File.join(installer.sandbox.root.to_s, 'Firebase', 'CoreOnly', 'Sources', 'Firebase.h')
  return unless File.file?(firebase_header)

  contents = File.read(firebase_header)
  swift_imports = [
    [
      '      #import <FirebaseAuth/FirebaseAuth-Swift.h>',
      "      #if __has_include(<FirebaseAuth/FirebaseAuth-Swift.h>)\\n        #import <FirebaseAuth/FirebaseAuth-Swift.h>\\n      #endif",
      "      #if __has_include(<FirebaseAuth/FirebaseAuth-Swift.h>)\\n        #if __has_include(<FirebaseAuth-Swift.h>)\\n        #import <FirebaseAuth-Swift.h>\\n      #endif\\n      #endif",
      "      #if __has_include(<FirebaseAuth-Swift.h>)\\n        #import <FirebaseAuth-Swift.h>\\n      #endif"
    ],
    [
      '    #import <FirebaseFunctions/FirebaseFunctions-Swift.h>',
      "    #if __has_include(<FirebaseFunctions/FirebaseFunctions-Swift.h>)\\n      #import <FirebaseFunctions/FirebaseFunctions-Swift.h>\\n    #endif",
      "    #if __has_include(<FirebaseFunctions/FirebaseFunctions-Swift.h>)\\n      #if __has_include(<FirebaseFunctions-Swift.h>)\\n      #import <FirebaseFunctions-Swift.h>\\n    #endif\\n    #endif",
      "    #if __has_include(<FirebaseFunctions-Swift.h>)\\n      #import <FirebaseFunctions-Swift.h>\\n    #endif"
    ],
    [
      '    #import <FirebaseStorage/FirebaseStorage-Swift.h>',
      "    #if __has_include(<FirebaseStorage/FirebaseStorage-Swift.h>)\\n      #import <FirebaseStorage/FirebaseStorage-Swift.h>\\n    #endif",
      "    #if __has_include(<FirebaseStorage/FirebaseStorage-Swift.h>)\\n      #if __has_include(<FirebaseStorage-Swift.h>)\\n      #import <FirebaseStorage-Swift.h>\\n    #endif\\n    #endif",
      "    #if __has_include(<FirebaseStorage-Swift.h>)\\n      #import <FirebaseStorage-Swift.h>\\n    #endif"
    ]
  ]

  patched = contents.dup
  swift_imports.each do |import_line, old_guarded_import, nested_guarded_import, guarded_import|
    patched = patched.gsub(nested_guarded_import, import_line)
    patched = patched.gsub(old_guarded_import, import_line)
    patched = patched.gsub(guarded_import, import_line)
    patched = patched.gsub(import_line, guarded_import)
  end
  FileUtils.chmod(0o644, firebase_header) if patched != contents
  File.write(firebase_header, patched) if patched != contents
end
`.trim();
const FIREBASE_SWIFT_HEADER_PATHS_HELPER = `
def add_firebase_swift_compatibility_header_paths!(installer)
  swift_header_paths = [
    '$(PODS_CONFIGURATION_BUILD_DIR)/FirebaseAuth/Swift\\ Compatibility\\ Header',
    '$(PODS_CONFIGURATION_BUILD_DIR)/FirebaseFunctions/Swift\\ Compatibility\\ Header',
    '$(PODS_CONFIGURATION_BUILD_DIR)/FirebaseStorage/Swift\\ Compatibility\\ Header'
  ]

  installer.pods_project.targets.each do |target|
    next unless target.name.start_with?('RNFB')

    target.build_configurations.each do |config|
      paths = config.build_settings['HEADER_SEARCH_PATHS'] || ['$(inherited)']
      paths = paths.split(' ') if paths.is_a?(String)
      config.build_settings['HEADER_SEARCH_PATHS'] = (paths + swift_header_paths).uniq
    end
  end
end
`.trim();
const FIREBASE_LINK_HELPER = `
def remove_firebase_firestore_internal_framework_link!(installer)
  xcconfigs = Dir.glob(
    File.join(installer.sandbox.root.to_s, 'Target Support Files', 'Pods-*', 'Pods-*.{debug,release}.xcconfig')
  )

  xcconfigs.each do |xcconfig|
    contents = File.read(xcconfig)
    patched = contents
      .gsub(' -weak_framework "FirebaseFirestoreInternal"', '')
      .gsub(' -framework "FirebaseFirestoreInternal"', '')
    File.write(xcconfig, patched) if patched != contents
  end
end
`.trim();
const GRPC_POST_INTEGRATE = `
post_integrate do |installer|
  fix_grpc_core_modulemap!(installer)
  patch_firebase_auth_swift_header_import!(installer)
  remove_firebase_firestore_internal_framework_link!(installer)
end
`.trim();

function addFileUtilsRequire(podfile) {
  if (podfile.includes(FILEUTILS_REQUIRE)) {
    return podfile;
  }

  if (podfile.includes("require 'json'")) {
    return podfile.replace("require 'json'", `${FILEUTILS_REQUIRE}\nrequire 'json'`);
  }

  return `${FILEUTILS_REQUIRE}\n${podfile}`;
}

function addGrpcModulemapFix(podfile) {
  let updatedPodfile = addFileUtilsRequire(podfile);

  if (!updatedPodfile.includes(GRPC_HELPER_NAME)) {
    const envLine = /^ENV\['RCT_NEW_ARCH_ENABLED'\].*$/m;

    if (envLine.test(updatedPodfile)) {
      updatedPodfile = updatedPodfile.replace(envLine, `${GRPC_HELPER}\n\n$&`);
    } else {
      updatedPodfile = `${GRPC_HELPER}\n\n${updatedPodfile}`;
    }
  }

  if (!updatedPodfile.includes(FIREBASE_AUTH_HELPER_NAME)) {
    const envLine = /^ENV\['RCT_NEW_ARCH_ENABLED'\].*$/m;

    if (envLine.test(updatedPodfile)) {
      updatedPodfile = updatedPodfile.replace(envLine, `${FIREBASE_AUTH_HELPER}\n\n$&`);
    } else {
      updatedPodfile = `${FIREBASE_AUTH_HELPER}\n\n${updatedPodfile}`;
    }
  }

  if (!updatedPodfile.includes(FIREBASE_SWIFT_HEADER_PATHS_HELPER_NAME)) {
    const envLine = /^ENV\['RCT_NEW_ARCH_ENABLED'\].*$/m;

    if (envLine.test(updatedPodfile)) {
      updatedPodfile = updatedPodfile.replace(
        envLine,
        `${FIREBASE_SWIFT_HEADER_PATHS_HELPER}\n\n$&`,
      );
    } else {
      updatedPodfile = `${FIREBASE_SWIFT_HEADER_PATHS_HELPER}\n\n${updatedPodfile}`;
    }
  }

  if (!updatedPodfile.includes(FIREBASE_LINK_HELPER_NAME)) {
    const envLine = /^ENV\['RCT_NEW_ARCH_ENABLED'\].*$/m;

    if (envLine.test(updatedPodfile)) {
      updatedPodfile = updatedPodfile.replace(envLine, `${FIREBASE_LINK_HELPER}\n\n$&`);
    } else {
      updatedPodfile = `${FIREBASE_LINK_HELPER}\n\n${updatedPodfile}`;
    }
  }

  if (!updatedPodfile.includes("post_integrate do |installer|")) {
    updatedPodfile = `${updatedPodfile.trimEnd()}\n\n${GRPC_POST_INTEGRATE}\n`;
  } else if (!/^\s+patch_firebase_auth_swift_header_import!\(installer\)/m.test(updatedPodfile)) {
    updatedPodfile = updatedPodfile.replace(
      /(post_integrate do \|installer\|\n)/,
      `$1  patch_firebase_auth_swift_header_import!(installer)\n`,
    );
  }

  if (
    updatedPodfile.includes("post_integrate do |installer|") &&
    !/^\s+remove_firebase_firestore_internal_framework_link!\(installer\)/m.test(updatedPodfile)
  ) {
    updatedPodfile = updatedPodfile.replace(
      /(post_integrate do \|installer\|\n)/,
      `$1  remove_firebase_firestore_internal_framework_link!(installer)\n`,
    );
  }

  if (
    updatedPodfile.includes("post_install do |installer|") &&
    !/^\s+add_firebase_swift_compatibility_header_paths!\(installer\)/m.test(updatedPodfile)
  ) {
    updatedPodfile = updatedPodfile.replace(
      /(post_install do \|installer\|\n)/,
      `$1    add_firebase_swift_compatibility_header_paths!(installer)\n`,
    );
  }

  return updatedPodfile;
}

function addFirebaseModularHeaders(podfile) {
  let updatedPodfile = podfile;

  for (const podLine of FIREBASE_MODULAR_HEADERS) {
    if (updatedPodfile.includes(podLine.trim())) {
      continue;
    }

    updatedPodfile = updatedPodfile.replace(
      /(\n\s*use_expo_modules!\n)/,
      `$1\n${podLine}\n`,
    );
  }

  return updatedPodfile;
}

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
      const podfile = await fs.promises.readFile(podfilePath, "utf8");
      const updatedPodfile = addGrpcModulemapFix(addFirebaseModularHeaders(podfile));

      if (updatedPodfile !== podfile) {
        await fs.promises.writeFile(podfilePath, updatedPodfile);
      }

      return config;
    },
  ]);
};
