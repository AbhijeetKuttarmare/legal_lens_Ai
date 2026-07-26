interface CheckoutOptions {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  planLabel: string;
  phone?: string | null;
}

export function buildRazorpayCheckoutHtml(opts: CheckoutOptions): string {
  const contact = opts.phone ? `91${opts.phone}` : '';
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0;padding:0;background:#0B1220;">
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <script>
        function post(data) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
        try {
          var options = {
            key: "${opts.keyId}",
            amount: "${opts.amount}",
            currency: "${opts.currency}",
            order_id: "${opts.orderId}",
            name: "LegalLens AI",
            description: "${opts.planLabel} Plan Subscription",
            prefill: { contact: "${contact}" },
            theme: { color: "#0B1220" },
            handler: function (response) {
              post({
                status: 'success',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
            },
            modal: {
              ondismiss: function () {
                post({ status: 'cancelled' });
              },
            },
          };
          var rzp = new Razorpay(options);
          rzp.on('payment.failed', function (response) {
            post({ status: 'failed', error: response.error && response.error.description });
          });
          rzp.open();
        } catch (e) {
          post({ status: 'failed', error: String(e) });
        }
      </script>
    </body>
  </html>`;
}
