const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const randomBtn = document.getElementById('random-btn');
const resetBtn = document.getElementById('reset-btn');
const typeSelect = document.getElementById('type-select');

const pokemonName = document.getElementById('pokemon-name');
const pokemonId = document.getElementById('pokemon-id');
const pokemonImg = document.getElementById('pokemon-img');
const pokemonTypes = document.getElementById('pokemon-types');
const pokemonSpecies = document.getElementById('pokemon-species');
const pokemonGeneration = document.getElementById('pokemon-generation');
const pokemonFlavor = document.getElementById('pokemon-flavor');
const pokemonStats = document.getElementById('pokemon-stats');

const evolutionContainer = document.getElementById('evolution-container');
const historyContainer = document.getElementById('history-container');

let currentPokemon = 1;
const maxPokemon = 1010;
let history = [];

async function fetchPokemon(query) {
    if (!query) return;
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${String(query).toLowerCase()}`);
        if (!res.ok) throw new Error('Pokémon não encontrado');
        const data = await res.json();

        // Nome e ID
        pokemonName.textContent = data.name;
        pokemonId.textContent = `#${data.id.toString().padStart(3,'0')}`;
        currentPokemon = data.id;

        // Imagem animada
        pokemonImg.src = data.sprites.versions['generation-v']['black-white'].animated.front_default || data.sprites.front_default;
        pokemonImg.alt = data.name;

        // Tipos
        pokemonTypes.innerHTML = '';
        data.types.forEach(typeInfo => {
            const span = document.createElement('span');
            span.textContent = typeInfo.type.name;
            span.className = `type type-${typeInfo.type.name}`;
            pokemonTypes.appendChild(span);
        });

        // Status
        pokemonStats.innerHTML = '';
        data.stats.forEach(stat => {
            const p = document.createElement('p');
            p.textContent = `${stat.stat.name}: ${stat.base_stat}`;
            pokemonStats.appendChild(p);
        });

        // Espécie e Região
        const speciesRes = await fetch(data.species.url);
        const speciesData = await speciesRes.json();
        pokemonSpecies.textContent = speciesData.genera.find(g => g.language.name === 'en')?.genus || speciesData.name;
        pokemonGeneration.textContent = `Geração: ${speciesData.generation.name.replace('generation-', '')}`;

        // Flavor text
        const flavorEntry = speciesData.flavor_text_entries.find(ft => ft.language.name === 'en');
        pokemonFlavor.textContent = flavorEntry ? flavorEntry.flavor_text.replace(/\n|\f/g, ' ') : '';

        // Linha evolutiva
        if (speciesData.evolution_chain) {
            fetchEvolutionChain(speciesData.evolution_chain.url);
        }

        // Atualiza histórico
        updateHistory(data);

    } catch (err) {
        alert(err.message);
    }
}

// Buscar linha evolutiva
async function fetchEvolutionChain(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Erro ao carregar evolução');
        const data = await res.json();

        evolutionContainer.innerHTML = '';

        let evoChain = [];
        let evoData = data.chain;

        do {
            evoChain.push(evoData.species.name);
            evoData = evoData.evolves_to[0];
        } while (evoData && evoData.hasOwnProperty('evolves_to'));

        for (let name of evoChain) {
            const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
            const pokeData = await pokeRes.json();

            const div = document.createElement('div');
            div.classList.add('evolution-item');
            div.innerHTML = `
                <img src="${pokeData.sprites.front_default}" alt="${name}">
                <p>${name}</p>
            `;
            evolutionContainer.appendChild(div);
        }
    } catch (err) {
        console.error("Erro ao carregar linha evolutiva:", err);
    }
}

// Atualizar histórico
function updateHistory(pokemon) {
    history = [pokemon, ...history.filter(p => p.id !== pokemon.id)].slice(0, 5);

    historyContainer.innerHTML = '';
    history.forEach(p => {
        const div = document.createElement('div');
        div.classList.add('history-item');
        div.innerHTML = `
            <img src="${p.sprites.front_default}" alt="${p.name}" title="${p.name}">
        `;
        historyContainer.appendChild(div);
    });
}

// Navegação
prevBtn.addEventListener('click', () => { if(currentPokemon>1) fetchPokemon(currentPokemon-1); });
nextBtn.addEventListener('click', () => { if(currentPokemon<maxPokemon) fetchPokemon(currentPokemon+1); });
randomBtn.addEventListener('click', () => fetchPokemon(Math.floor(Math.random()*maxPokemon)+1));
resetBtn.addEventListener('click', () => fetchPokemon(1));

// Pesquisa
searchBtn.addEventListener('click', () => fetchPokemon(searchInput.value));
searchInput.addEventListener('keypress', e => { if(e.key==='Enter') fetchPokemon(searchInput.value); });

typeSelect.addEventListener('change', () => {
    if(typeSelect.value) {
        fetchPokemonByType(typeSelect.value);
    }
});

async function fetchPokemonByType(type) {
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
        if(!res.ok) throw new Error('Tipo não encontrado');
        const data = await res.json();
        const randomPokemon = data.pokemon[Math.floor(Math.random()*data.pokemon.length)].pokemon.name;
        fetchPokemon(randomPokemon);
    } catch(err){
        alert(err.message);
    }
}

fetchPokemon(currentPokemon);
