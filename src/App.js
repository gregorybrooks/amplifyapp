import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listTodos } from './graphql/queries';
import { createTodo as createTodoMutation, deleteTodo as deleteTodoMutation } from './graphql/mutations';

const initialFormState = { name: '', description: '' }

function App() {
    const [Recipes, setRecipes] = useState([]);
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchRecipes();
    }, []);

    async function fetchRecipes() {
        const apiData = await API.graphql({ query: listTodos });
        const RecipesFromAPI = apiData.data.listTodos.items;

        await Promise.all(RecipesFromAPI.map(async Recipe => {
            if (Recipe.image) {
                const image = await Storage.get(Recipe.image);
                Recipe.image = image;
            }
            return Recipe;
        }))

        setRecipes(apiData.data.listTodos.items);
    }

    async function onChange(e) {
        if (!e.target.files[0]) return
        const file = e.target.files[0];
        setFormData({ ...formData, image: file.name });
        await Storage.put(file.name, file);
        fetchRecipes();
    }

    async function createRecipe() {
        if (!formData.name || !formData.description) return;
        await API.graphql({ query: createTodoMutation, variables: { input: formData } });
        if (formData.image) {
            const image = await Storage.get(formData.image);
            formData.image = image;
        }
        setRecipes([ ...Recipes, formData ]);
        setFormData(initialFormState);
    }

    async function deleteRecipe({ id }) {
        const newRecipesArray = Recipes.filter(Recipe => Recipe.id !== id);
        setRecipes(newRecipesArray);
        await API.graphql({ query: deleteTodoMutation, variables: { input: { id } }});
    }

    return (
        <div className="App">
            <h1>My Recipes App</h1>
            <input
                onChange={e => setFormData({ ...formData, 'name': e.target.value})}
                placeholder="Recipe name"
                value={formData.name}
            />
            <input
                onChange={e => setFormData({ ...formData, 'description': e.target.value})}
                placeholder="Recipe description"
                value={formData.description}
            />
            <input
                type="file"
                onChange={onChange}
            />
            <button onClick={createRecipe}>Create Recipe</button>
            <div style={{marginBottom: 30}}>
                {
                    Recipes.map(Recipe => (
                        <div key={Recipe.id || Recipe.name}>
                            <h2>{Recipe.name}</h2>
                            <p>{Recipe.description}</p>
                            <button onClick={() => deleteRecipe(Recipe)}>Delete Recipe</button>
                            {
                                Recipe.image && <img src={Recipe.image} alt="Picture" style={{width: 400}} />
                            }
                        </div>
                    ))
                }
            </div>
            <AmplifySignOut />
        </div>
    );
}

export default withAuthenticator(App);