<script>
  import Header from "$lib/header/Header.svelte";
  import Footer from "$lib/footer/Footer.svelte";
  import "../app.css";
</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<Header />

<main>
  <slot />
</main>

<Footer />
