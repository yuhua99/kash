<script lang="ts">
  import './Block.css'
  export let title: string
</script>

<section class="block">
  <header class="block__header">
    <p>{title}</p>
  </header>
  <div class="block__content">
    <slot />
  </div>
</section>
