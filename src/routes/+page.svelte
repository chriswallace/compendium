<script>
  import MailingList from "$lib/components/MailingList.svelte";
  import FeaturedTheme from "$lib/components/FeaturedTheme.svelte";
</script>

<svelte:head>
  <title>Compendium: a standalone web app for your art gallery</title>
</svelte:head>

<div class="hero">
  <div class="container">
    <h1>Show off your digital art collection <i>in style</i>.</h1>
    <a href="/medici" class="button">Get Started</a>
  </div>
</div>

<MailingList />

<FeaturedTheme />

<style type="scss">
  .hero {
    @apply h-screen w-screen flex flex-col justify-center items-start mx-auto;
    background-image: url("/images/art-grid.png");
    background-size: contain;
    background-position: bottom right;
    background-repeat: no-repeat;
  }

  .container {
    @apply max-w-[calc(100%-2rem)] lg:max-w-[calc(100%-4rem)] mx-auto;
  }

  h1 {
    @apply text-[3.8rem];
  }
</style>
