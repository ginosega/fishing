// Keep the isolated P3 mock broker tests in the normal full application CI gate.
// No network, secrets, write-capable provider or production deployment is used.
import '../../experiments/p3/test/broker.test.mjs';
