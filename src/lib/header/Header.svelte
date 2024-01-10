<script>
</script>

<header>
  <nav aria-label="Global">
    <a href="/" class="logo">Compendium</a>

    <ul class="menu">
      <li><a href="/">About</a></li>
      <li><a href="/">Themes</a></li>
      <li><a href="/">Support</a></li>
    </ul>

    <a href="#" class="cta">Get Started</a>
  </nav>
</header>

<style lang="scss">
  header {
    @apply pt-8 pb-10 fixed left-0 top-0 right-0 bg-[var(--background-without-opacity)];
  }

  nav {
    @apply flex max-w-[calc(100%-4rem)] mx-auto;
  }

  a {
    @apply text-secondary no-underline hover:underline underline-offset-8 decoration-2 decoration-secondary hover:text-primary hover:decoration-primary font-medium uppercase;
  }

  a.cta {
    @apply underline;
    letter-spacing: 0.06em;
  }

  .menu {
    @apply flex-grow flex justify-center;

    li {
      @apply mx-6 tracking-widest;
    }
  }

  .logo {
    @apply font-display lowercase tracking-tighter;
    font-size: 34px;
  }
</style>
