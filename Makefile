ARCHES := x86
# x86_64 only: upstream publishes no arm64 image (dropped in 1.2.0:0)
# overrides to s9pk.mk must precede the include statement
include node_modules/@start9labs/start-sdk/s9pk.mk
