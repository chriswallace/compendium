<div class="footer">
  <div class="container">
    <div class="logo">Compendium</div>
    <div class="links">
      <a href="#">About</a>
      <a href="#">Themes</a>
      <a href="#">Support</a>
      <a href="#">Get Started</a>
    </div>
    <div class="newsletter">
      <form>
        <label for="email-address">Subscribe to our mailing list.</label>
        <input name="email-address" type="email" placeholder="Email Address" />
        <button>Subscribe</button>
      </form>
    </div>
    <div class="copyright">
      Copyright 2024 Compendium.<br />All Rights Reserved.
    </div>
  </div>
</div>

<style lang="scss">
  .footer {
    @apply text-center lg:text-left w-full bg-white py-24;
  }

  .container {
    @apply max-w-[95%] xl:max-w-[84%] grid lg:grid-cols-5 gap-8 mx-auto;
  }

  .logo {
    @apply font-display text-4xl lg:text-3xl lowercase;
    letter-spacing: -0.04em;
  }

  .links a {
    @apply block text-secondary leading-loose underline-offset-4 decoration-2 decoration-primary mb-1 text-xl font-semibold text-primary;
  }

  .newsletter {
    @apply lg:col-span-2 border border-[#ccc] rounded-md p-8;
  }

  label {
    @apply block font-display text-2xl mb-4 text-secondary;
    letter-spacing: -0.02em;
  }

  input[type="email"],
  button {
    @apply h-12 px-6 py-4 rounded-md;
  }

  input[type="email"] {
    @apply w-full mb-3 sm:mb-0 sm:w-[calc(60%-0.5rem)] inline-block;
  }

  button {
    @apply w-full sm:w-[calc(40%-0.5rem)] sm:ml-[0.5rem] inline-block;
  }

  .copyright {
    @apply lg:text-right text-[#777];
  }
</style>
