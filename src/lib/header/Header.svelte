<script>
  import { afterNavigate } from "$app/navigation";
  import { page } from "$app/stores";
  import { updateColors } from "$lib/updateColors";

  let menuOpen = false;

  // Reactive statement to handle page changes
  $: currentPage = $page.url.pathname;

  $: if (currentPage) {
    updateColors(currentPage);
  }

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  afterNavigate(() => {
    menuOpen = false;
    updateColors(currentPage);
  });
</script>

<header class="navigation">
  <nav aria-label="Global" class="menu">
    <a href="/" class="logo">Compendium</a>

    <div class="{menuOpen ? '' : 'hide-on-mobile'} mobile-menu">
      <a href="/" class="logo hide-on-desktop">Compendium</a>

      <ul class="menu">
        <li><a href="/medici">Medici</a></li>
        <li><a href="/tools">Tools</a></li>
        <li><a href="/support">Support</a></li>
      </ul>

      <div class="cta-container">
        <a href="/medici" class="cta">Get Started</a>
      </div>

      <button
        class={menuOpen ? "close-menu" : "close-menu hide-on-desktop"}
        on:click={toggleMenu}
        aria-label="Close">Close</button
      >
    </div>
  </nav>

  <button class="open-menu" on:click={toggleMenu} aria-label="Menu">Menu</button
  >
</header>

<style lang="scss">
  header {
    @apply pt-8 md:pt-6 md:pb-8 fixed left-0 top-0 right-0;
  }

  .mobile-menu {
    @apply md:flex w-full mx-auto fixed inset-0 z-20 md:relative;
  }

  .hide-on-mobile {
    @apply hidden md:flex;
  }

  .hide-on-desktop {
    @apply block md:hidden;
  }

  .close-menu {
    @apply absolute bottom-4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 md:hidden;
  }

  a {
    @apply text-lg md:text-base text-center my-3 inline-block text-[var(--color-secondary)] no-underline hover:underline underline-offset-8 decoration-2 decoration-[var(--color-secondary)] hover:text-[var(--color-primary-hover)] hover:decoration-[var(--color-primary-hover)] font-semibold uppercase;
    letter-spacing: 1px;
  }

  .cta-container {
    @apply text-center md:inline;
  }

  a.cta {
    @apply underline mx-auto;
    letter-spacing: 1px;
  }

  .menu {
    @apply flex-grow md:flex max-w-[calc(100%-2rem)] lg:max-w-[calc(100%-4rem)] mx-auto justify-center md:h-auto md:mt-0 mb-6 md:mb-0;

    li {
      @apply md:mx-4 lg:mx-6 tracking-widest text-center;
    }
  }

  .open-menu {
    @apply fixed top-6 right-[1.5rem] z-10 py-3 px-6 bg-[var(--nav-background)] font-semibold text-secondary outline outline-secondary rounded-sm md:hidden hover:outline-primary hover:bg-primary hover:text-white;
  }

  .logo {
    @apply font-display text-[28px] md:text-[30px] lowercase tracking-tighter my-0 md:mt-2;

    .mobile-menu & {
      @apply block md:hidden text-[36px] my-16;
    }
  }

  :global {
    .navigation,
    body.default,
    .mobile-menu {
      @apply bg-[var(--background-without-opacity)];
    }

    .medici .navigation,
    body.medici,
    .medici .mobile-menu {
      @apply bg-[var(--color-tertiary)];
    }
  }
</style>
