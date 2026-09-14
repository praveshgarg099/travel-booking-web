/**
 * Dynamically loads the Razorpay checkout script into document body.
 * Returns a Promise resolving to true if loaded successfully, false otherwise.
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      resolve(true)
    }
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK')
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

export default loadRazorpayScript
