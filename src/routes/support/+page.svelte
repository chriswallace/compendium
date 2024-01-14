<script>
</script>

<svelte:head>
  <title>Support // Compendium</title>
</svelte:head>

<div class="container">
  <div class="heading-group">
    <h1>Support</h1>
    <div class="subtitle">
      Questions? Comments? Concerns? We're here to help.
    </div>
  </div>

  <p>
    To open a ticket, please email us at <a href="mailto:support@cpdm.app"
      >support@cpdm.app</a
    >.
  </p>
</div>

<style lang="scss">
  .container {
    @apply mt-36 mb-24 max-w-7xl w-[calc(100%-2rem)] lg:w-[calc(100%-4rem)] mx-auto;
  }

  .heading-group {
    @apply mb-12;

    h1 {
      @apply mb-4;
    }
    .subtitle {
      @apply text-[1.2rem] text-[var(--text-secondary)];
    }

    &:after {
      @apply overflow-hidden h-1 w-8 bg-primary block;
      content: "";
    }
  }

  p {
    @apply text-lg;
  }

  a {
    @apply font-semibold;
  }
</style>
