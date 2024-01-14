<script>
</script>

<svelte:head>
  <title>Already Subscribed // Compendium</title>
</svelte:head>

<div class="container">
  <div class="heading-group">
    <h1>Whoa, partner!</h1>
    <div class="subtitle">
      You're already subscribed to the Compendium mailing list. You're all set.
    </div>
  </div>
</div>

<style lang="scss">
  .container {
    @apply mt-36 mb-24 max-w-7xl w-[calc(100%-2rem)] lg:w-[calc(100%-4rem)] mx-auto;
  }

  .heading-group {
    @apply mb-12;

    h1 {
      @apply mb-2;
    }
    .subtitle {
      @apply text-[1.2rem] text-[var(--text-secondary)];
    }
  }
</style>
