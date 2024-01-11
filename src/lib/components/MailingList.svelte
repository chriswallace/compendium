<div class="mailing-list">
  <div class="container">
    <div class="subtitle-group">
      <div class="subtitle">Stay updated. Subscribe to our mailing list.</div>
      <p>Get notified when new themes and products are released.</p>
    </div>
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
</div>

<style lang="scss">
  .mailing-list {
    @apply w-full bg-white py-8 md:py-12;
  }

  .container {
    @apply grid grid-cols-6 lg:grid-cols-5 gap-2 md:gap-6 mx-auto items-center justify-center max-w-[84%] w-[calc(100%-2rem)];
  }

  .subtitle-group {
    @apply col-span-6 lg:col-span-3;
  }

  .subtitle {
    @apply font-display text-3xl text-secondary;
    letter-spacing: -0.02em;
  }

  p {
    @apply text-[#5F6E5E] md:text-xl mb-6 lg:mb-0;
  }

  form {
    @apply col-span-6 lg:col-span-2 text-right grid grid-cols-1 sm:grid-cols-4 gap-3 w-full;
  }

  input[type="text"],
  input[type="email"] {
    @apply sm:col-span-2 text-lg;

    &::placeholder {
      @apply text-[#908375];
    }
  }

  input[type="text"],
  input[type="email"],
  input[type="submit"] {
    @apply rounded-md p-4 px-4 h-16;
  }

  input[type="submit"] {
    @apply sm:col-span-4;
  }
</style>
