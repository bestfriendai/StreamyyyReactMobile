#!/bin/sh
set -e
set -u
set -o pipefail

function on_error {
  echo "$(realpath -mq "${0}"):$1: error: Unexpected failure"
}
trap 'on_error $LINENO' ERR


# This protects against multiple targets copying the same framework dependency at the same time. The solution
# was originally proposed here: https://lists.samba.org/archive/rsync/2008-February/020158.html
RSYNC_PROTECT_TMP_FILES=(--filter "P .*.??????")


variant_for_slice()
{
  case "$1" in
  "libskia.xcframework/ios-arm64_arm64e")
    echo ""
    ;;
  "libskia.xcframework/ios-arm64_arm64e_x86_64-simulator")
    echo "simulator"
    ;;
  "libskia.xcframework/macos-arm64_x86_64")
    echo ""
    ;;
  "libskia.xcframework/tvos-arm64_arm64e")
    echo ""
    ;;
  "libskia.xcframework/tvos-arm64_arm64e_x86_64-simulator")
    echo "simulator"
    ;;
  "libsvg.xcframework/ios-arm64_arm64e")
    echo ""
    ;;
  "libsvg.xcframework/ios-arm64_arm64e_x86_64-simulator")
    echo "simulator"
    ;;
  "libsvg.xcframework/macos-arm64_x86_64")
    echo ""
    ;;
  "libsvg.xcframework/tvos-arm64_arm64e")
    echo ""
    ;;
  "libsvg.xcframework/tvos-arm64_arm64e_x86_64-simulator")
    echo "simulator"
    ;;
  "libskshaper.xcframework/ios-arm64_arm64e")
    echo ""
    ;;
  "libskshaper.xcframework/ios-arm64_arm64e_x86_64-simulator")
    echo "simulator"
    ;;
  "libskshaper.xcframework/macos-arm64_x86_64")
    echo ""
    ;;
  "libskshaper.xcframework/tvos-arm64_arm64e")
    echo ""
    ;;
  "libskshaper.xcframework/tvos-arm64_arm64e_x86_64-simulator")
    echo "simulator"
    ;;
  "libskparagraph.xcframework/ios-arm64_arm64e")
    echo ""
    ;;
  "libskparagraph.xcframework/ios-arm64_arm64e_x86_64-simulator")
    echo "simulator"
    ;;
  "libskparagraph.xcframework/macos-arm64_x86_64")
    echo ""
    ;;
  "libskparagraph.xcframework/tvos-arm64_arm64e")
    echo ""
    ;;
  "libskparagraph.xcframework/tvos-arm64_arm64e_x86_64-simulator")
    echo "simulator"
    ;;
  "libskunicode_core.xcframework/ios-arm64_arm64e")
    echo ""
    ;;
  "libskunicode_core.xcframework/ios-arm64_arm64e_x86_64-simulator")
    echo "simulator"
    ;;
  "libskunicode_core.xcframework/macos-arm64_x86_64")
    echo ""
    ;;
  "libskunicode_core.xcframework/tvos-arm64_arm64e")
    echo ""
    ;;
  "libskunicode_core.xcframework/tvos-arm64_arm64e_x86_64-simulator")
    echo "simulator"
    ;;
  "libskunicode_libgrapheme.xcframework/ios-arm64_arm64e")
    echo ""
    ;;
  "libskunicode_libgrapheme.xcframework/ios-arm64_arm64e_x86_64-simulator")
    echo "simulator"
    ;;
  "libskunicode_libgrapheme.xcframework/macos-arm64_x86_64")
    echo ""
    ;;
  "libskunicode_libgrapheme.xcframework/tvos-arm64_arm64e")
    echo ""
    ;;
  "libskunicode_libgrapheme.xcframework/tvos-arm64_arm64e_x86_64-simulator")
    echo "simulator"
    ;;
  esac
}

archs_for_slice()
{
  case "$1" in
  "libskia.xcframework/ios-arm64_arm64e")
    echo "arm64 arm64e"
    ;;
  "libskia.xcframework/ios-arm64_arm64e_x86_64-simulator")
    echo "arm64 arm64e x86_64"
    ;;
  "libskia.xcframework/macos-arm64_x86_64")
    echo "arm64 x86_64"
    ;;
  "libskia.xcframework/tvos-arm64_arm64e")
    echo "arm64 arm64e"
    ;;
  "libskia.xcframework/tvos-arm64_arm64e_x86_64-simulator")
    echo "arm64 arm64e x86_64"
    ;;
  "libsvg.xcframework/ios-arm64_arm64e")
    echo "arm64 arm64e"
    ;;
  "libsvg.xcframework/ios-arm64_arm64e_x86_64-simulator")
    echo "arm64 arm64e x86_64"
    ;;
  "libsvg.xcframework/macos-arm64_x86_64")
    echo "arm64 x86_64"
    ;;
  "libsvg.xcframework/tvos-arm64_arm64e")
    echo "arm64 arm64e"
    ;;
  "libsvg.xcframework/tvos-arm64_arm64e_x86_64-simulator")
    echo "arm64 arm64e x86_64"
    ;;
  "libskshaper.xcframework/ios-arm64_arm64e")
    echo "arm64 arm64e"
    ;;
  "libskshaper.xcframework/ios-arm64_arm64e_x86_64-simulator")
    echo "arm64 arm64e x86_64"
    ;;
  "libskshaper.xcframework/macos-arm64_x86_64")
    echo "arm64 x86_64"
    ;;
  "libskshaper.xcframework/tvos-arm64_arm64e")
    echo "arm64 arm64e"
    ;;
  "libskshaper.xcframework/tvos-arm64_arm64e_x86_64-simulator")
    echo "arm64 arm64e x86_64"
    ;;
  "libskparagraph.xcframework/ios-arm64_arm64e")
    echo "arm64 arm64e"
    ;;
  "libskparagraph.xcframework/ios-arm64_arm64e_x86_64-simulator")
    echo "arm64 arm64e x86_64"
    ;;
  "libskparagraph.xcframework/macos-arm64_x86_64")
    echo "arm64 x86_64"
    ;;
  "libskparagraph.xcframework/tvos-arm64_arm64e")
    echo "arm64 arm64e"
    ;;
  "libskparagraph.xcframework/tvos-arm64_arm64e_x86_64-simulator")
    echo "arm64 arm64e x86_64"
    ;;
  "libskunicode_core.xcframework/ios-arm64_arm64e")
    echo "arm64 arm64e"
    ;;
  "libskunicode_core.xcframework/ios-arm64_arm64e_x86_64-simulator")
    echo "arm64 arm64e x86_64"
    ;;
  "libskunicode_core.xcframework/macos-arm64_x86_64")
    echo "arm64 x86_64"
    ;;
  "libskunicode_core.xcframework/tvos-arm64_arm64e")
    echo "arm64 arm64e"
    ;;
  "libskunicode_core.xcframework/tvos-arm64_arm64e_x86_64-simulator")
    echo "arm64 arm64e x86_64"
    ;;
  "libskunicode_libgrapheme.xcframework/ios-arm64_arm64e")
    echo "arm64 arm64e"
    ;;
  "libskunicode_libgrapheme.xcframework/ios-arm64_arm64e_x86_64-simulator")
    echo "arm64 arm64e x86_64"
    ;;
  "libskunicode_libgrapheme.xcframework/macos-arm64_x86_64")
    echo "arm64 x86_64"
    ;;
  "libskunicode_libgrapheme.xcframework/tvos-arm64_arm64e")
    echo "arm64 arm64e"
    ;;
  "libskunicode_libgrapheme.xcframework/tvos-arm64_arm64e_x86_64-simulator")
    echo "arm64 arm64e x86_64"
    ;;
  esac
}

copy_dir()
{
  local source="$1"
  local destination="$2"

  # Use filter instead of exclude so missing patterns don't throw errors.
  echo "rsync --delete -av "${RSYNC_PROTECT_TMP_FILES[@]}" --links --filter \"- CVS/\" --filter \"- .svn/\" --filter \"- .git/\" --filter \"- .hg/\" \"${source}*\" \"${destination}\""
  rsync --delete -av "${RSYNC_PROTECT_TMP_FILES[@]}" --links --filter "- CVS/" --filter "- .svn/" --filter "- .git/" --filter "- .hg/" "${source}"/* "${destination}"
}

SELECT_SLICE_RETVAL=""

select_slice() {
  local xcframework_name="$1"
  xcframework_name="${xcframework_name##*/}"
  local paths=("${@:2}")
  # Locate the correct slice of the .xcframework for the current architectures
  local target_path=""

  # Split archs on space so we can find a slice that has all the needed archs
  local target_archs=$(echo $ARCHS | tr " " "\n")

  local target_variant=""
  if [[ "$PLATFORM_NAME" == *"simulator" ]]; then
    target_variant="simulator"
  fi
  if [[ ! -z ${EFFECTIVE_PLATFORM_NAME+x} && "$EFFECTIVE_PLATFORM_NAME" == *"maccatalyst" ]]; then
    target_variant="maccatalyst"
  fi
  for i in ${!paths[@]}; do
    local matched_all_archs="1"
    local slice_archs="$(archs_for_slice "${xcframework_name}/${paths[$i]}")"
    local slice_variant="$(variant_for_slice "${xcframework_name}/${paths[$i]}")"
    for target_arch in $target_archs; do
      if ! [[ "${slice_variant}" == "$target_variant" ]]; then
        matched_all_archs="0"
        break
      fi

      if ! echo "${slice_archs}" | tr " " "\n" | grep -F -q -x "$target_arch"; then
        matched_all_archs="0"
        break
      fi
    done

    if [[ "$matched_all_archs" == "1" ]]; then
      # Found a matching slice
      echo "Selected xcframework slice ${paths[$i]}"
      SELECT_SLICE_RETVAL=${paths[$i]}
      break
    fi
  done
}

install_xcframework() {
  local basepath="$1"
  local name="$2"
  local package_type="$3"
  local paths=("${@:4}")

  # Locate the correct slice of the .xcframework for the current architectures
  select_slice "${basepath}" "${paths[@]}"
  local target_path="$SELECT_SLICE_RETVAL"
  if [[ -z "$target_path" ]]; then
    echo "warning: [CP] $(basename ${basepath}): Unable to find matching slice in '${paths[@]}' for the current build architectures ($ARCHS) and platform (${EFFECTIVE_PLATFORM_NAME-${PLATFORM_NAME}})."
    return
  fi
  local source="$basepath/$target_path"

  local destination="${PODS_XCFRAMEWORKS_BUILD_DIR}/${name}"

  if [ ! -d "$destination" ]; then
    mkdir -p "$destination"
  fi

  copy_dir "$source/" "$destination"
  echo "Copied $source to $destination"
}

install_xcframework "${PODS_ROOT}/../../node_modules/@shopify/react-native-skia/libs/apple/libskia.xcframework" "react-native-skia" "library" "ios-arm64_arm64e" "ios-arm64_arm64e_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/@shopify/react-native-skia/libs/apple/libsvg.xcframework" "react-native-skia" "library" "ios-arm64_arm64e" "ios-arm64_arm64e_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/@shopify/react-native-skia/libs/apple/libskshaper.xcframework" "react-native-skia" "library" "ios-arm64_arm64e" "ios-arm64_arm64e_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/@shopify/react-native-skia/libs/apple/libskparagraph.xcframework" "react-native-skia" "library" "ios-arm64_arm64e" "ios-arm64_arm64e_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/@shopify/react-native-skia/libs/apple/libskunicode_core.xcframework" "react-native-skia" "library" "ios-arm64_arm64e" "ios-arm64_arm64e_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/@shopify/react-native-skia/libs/apple/libskunicode_libgrapheme.xcframework" "react-native-skia" "library" "ios-arm64_arm64e" "ios-arm64_arm64e_x86_64-simulator"

