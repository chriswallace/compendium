<div class="mailing-list">
  <div class="container">
    <div class="subtitle-group">
      <div class="subtitle">Subscribe to our mailing list.</div>
      <p>Get notified when new themes and products are released.</p>
    </div>
    <form>
      <input type="email" placeholder="Email Address" />
      <button>Subscribe</button>
    </form>
  </div>
</div>

<style lang="scss">
  .mailing-list {
    @apply w-full bg-white py-8 md:py-12;
  }

  .container {
    @apply grid grid-cols-6 lg:grid-cols-5 mx-auto items-center justify-center max-w-[84%] w-[calc(100%-2rem)];
  }

  .subtitle-group {
    @apply col-span-6 lg:col-span-3;
  }

  .subtitle {
    @apply font-display text-3xl mb-2 text-secondary;
    letter-spacing: -0.02em;
  }

  p {
    @apply text-[#5F6E5E] md:text-xl mb-6 lg:mb-0;
  }

  form {
    @apply col-span-6 lg:col-span-2 text-right grid grid-cols-3 gap-3 w-full;
  }

  input[type="email"] {
    @apply col-span-2 text-lg;

    &::placeholder {
      @apply text-[#908375];
    }
  }

  input[type="email"],
  button {
    @apply rounded-md p-4 px-8 h-16;
  }
</style>
