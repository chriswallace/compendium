<script>
  import MailingList from "$lib/components/MailingList.svelte";
  import FeaturedTheme from "$lib/components/FeaturedTheme.svelte";
</script>

<svelte:head>
  <title>Compendium: a standalone web app for your art gallery</title>
</svelte:head>

<div class="hero">
  <h1>Show off your digital art collection <i>in style</i>.</h1>
  <a href="#" class="button">Get Started</a>
</div>

<MailingList />

<FeaturedTheme themeName="Medici" img="/images/medici-screen.png" />

<style type="scss">
  .hero {
    @apply h-screen w-screen flex flex-col justify-center items-start px-8;
    background-image: url("/images/art-grid.png");
    background-size: contain;
    background-position: bottom right;
    background-repeat: no-repeat;
  }
</style>
