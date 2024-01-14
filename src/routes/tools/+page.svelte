<script>
</script>

<svelte:head>
  <title>Tools // Compendium</title>
</svelte:head>

<div class="container">
  <div class="heading-group">
    <h1>Tools</h1>
    <div class="subtitle">
      A collection of tools made exclusively for Compendium owners.
    </div>
  </div>
  <div class="tools">
    <div class="tool-feature">
      <h2>Ethereum NFT Export <span class="coming-soon">coming soon</span></h2>
      <p>
        A node-based script for exporting Ethereum NFTs held in a specific
        wallet to a CSV file.
      </p>
    </div>
    <div class="tool-feature">
      <h2>Tezos NFT Export <span class="coming-soon">coming soon</span></h2>
      <p>
        A node-based script for exporting Tezos NFTs held in a specific wallet
        to a CSV file.
      </p>
    </div>
    <div class="tool-feature">
      <h2>
        Generative Art Video Recorder <span class="coming-soon"
          >coming soon</span
        >
      </h2>
      <p>
        A puppeteer-based script for recording video of interactive generative
        art. Also includes an option to upload to an ImageKit account.
      </p>
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

    &:after {
      @apply overflow-hidden h-1 w-8 bg-primary block;
      content: "";
    }
  }

  .coming-soon {
    @apply text-sm font-sans tracking-tight inline-block pt-1 pb-2 px-3 bg-[var(--color-tertiary)] -top-1 ml-2 relative rounded-md;
  }

  .tools {
    @apply grid grid-cols-1 md:grid-cols-2 gap-8;
  }
</style>
