// Script will skip the postinstall script if `SKIP_POSTINSTALL` env variable is set
if (process.env.SKIP_POSTINSTALL) {
  process.exit(0);
} else {
  process.exit(1);
}
