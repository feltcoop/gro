<script lang="ts">
	import {Writable} from 'svelte/store';

	import BuildName from './BuildName.svelte';
	import PlatformName from './PlatformName.svelte';
	import {getMetasByBuildName, SourceTree} from './sourceTree.js';
	import {View} from './view.js';
	import {SourceMeta} from '../build/sourceMeta.js';

	export let sourceTree: SourceTree;
	export let selectedBuildNames: string[];
	export let activeSourceMetaView: View;
	export let selectedSourceMeta: Writable<SourceMeta | null>;
	export let hoveredSourceMeta: Writable<SourceMeta | null>;
</script>

<div class="source-meta">
	<form>
		{#each sourceTree.buildConfigs as buildConfig (buildConfig.name)}
			<div>
				<label>
					<input type="checkbox" bind:group={selectedBuildNames} value={buildConfig.name} />
					<BuildName buildName={buildConfig.name} />
					<small>
						({getMetasByBuildName(sourceTree, buildConfig.name).length})

						<PlatformName platformName={buildConfig.platform} />
						{#if buildConfig.primary}primary{/if}
						{#if buildConfig.dist}dist{/if}
					</small>
				</label>
			</div>
		{/each}
	</form>
	<svelte:component
		this={activeSourceMetaView}
		{sourceTree}
		{selectedSourceMeta}
		{hoveredSourceMeta}
		{selectedBuildNames}
	/>
</div>
