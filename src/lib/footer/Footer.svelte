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
      <form
        method="post"
        class="af-form-wrapper"
        accept-charset="UTF-8"
        action="https://www.aweber.com/scripts/addlead.pl"
      >
        <div class="hidden">
          <input type="hidden" name="meta_web_form_id" value="151318046" />
          <input type="hidden" name="meta_split_id" value="" />
          <input type="hidden" name="listname" value="awlist6701372" />
          <input
            type="hidden"
            name="redirect"
            value="https://cpdm.app/success"
            id="redirect_77675920773651233b7e23034e65e93f"
          />
          <input
            type="hidden"
            name="meta_redirect_onlist"
            value="https://cpdm.app/already-subscribed"
          />
          <input
            type="hidden"
            name="meta_adtracking"
            value="Website_Subscription_Box"
          />
          <input type="hidden" name="meta_message" value="1" />
          <input type="hidden" name="meta_required" value="name,email" />

          <input type="hidden" name="meta_tooltip" value="" />
        </div>
        <label for="name">Subscribe to our mailing list.</label>
        <input
          type="text"
          id="awf_field-116728999"
          name="name"
          tabindex="500"
          placeholder="Name"
        />
        <input
          type="email"
          name="email"
          id="awf_field-116729000"
          tabindex="501"
          placeholder="Email Address"
        />
        <input type="submit" tabindex="502" value="Subscribe" />
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
    @apply block text-secondary leading-loose underline-offset-4 decoration-2 decoration-primary mb-1 text-xl font-normal text-primary;
  }

  .newsletter {
    @apply lg:col-span-2 border border-[#ccc] rounded-md p-8;
  }

  form {
    @apply grid grid-cols-2 gap-2;
  }

  label {
    @apply col-span-2 font-display text-2xl mb-4 text-secondary;
    letter-spacing: -0.02em;
  }

  input[type="text"],
  input[type="email"],
  input[type="submit"] {
    @apply h-12 px-6 py-4 rounded-md;
  }

  input[type="text"],
  input[type="email"] {
    @apply w-full;
  }

  input[type="submit"] {
    @apply col-span-2;
  }

  .copyright {
    @apply lg:text-right text-[#777];
  }
</style>
