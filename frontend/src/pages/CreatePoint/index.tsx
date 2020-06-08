import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';

import './styles.css';
import logo from '../../assets/logo.svg';
import { FiArrowLeft } from "react-icons/fi";
import { Link, useHistory } from 'react-router-dom';
import { Map, TileLayer, Marker } from "react-leaflet";
import api from '../../services/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';

interface Item {
    id: number,
    title: string,
    image_url: string
}
interface IBGEUFResponse {
    sigla: string,
    nome: string
}
interface IBGECityResponse {
    id: number
    nome: string
}

const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [UFs, setUFs] = useState<IBGEUFResponse[]>([]);
    const [selectedUF, setSelectedUF] = useState('0');
    const [cities, setCities] = useState<IBGECityResponse[]>([]);
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [initialPosition, setInitialPosition] = useState<[number, number]>([-12.0531885,-50.8984865]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    });

    const history = useHistory();

    useEffect(()=>{
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            setInitialPosition([latitude, longitude]);
        });
    }, []);
    useEffect(()=>{
        api.get('/items').then(res => {
            setItems(res.data);
        })
    }, []);
    useEffect(()=>{
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(res => {
            const UFs = res.data.map(uf => {return {sigla: uf.sigla, nome: uf.nome}});
            setUFs(UFs);
        });
    }, []);
    useEffect(()=>{
        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/microrregioes`).then(res => {
            const cities = res.data.map(city => {return {nome: city.nome, id: city.id}});
            setCities(cities);
        });
    }, [selectedUF]);

    function handleSelectUF(event: ChangeEvent<HTMLSelectElement>){
        setSelectedUF(event.target.value);
    }
    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>){
        setSelectedCity(event.target.value);
    }
    function handleMapClick(event: LeafletMouseEvent){
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ]);
    }
    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        const { name, value } = event.target;
        setFormData({...formData, [name]: value});
    }
    function handleSelectItem(id: number){
        const alreadySelected = selectedItems.findIndex(item => item === id);
        if (alreadySelected>=0) {
            const filteredItems = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredItems);
        } else 
            setSelectedItems([...selectedItems, id]);
    }
    async function handleSubmit(event: FormEvent){
        event.preventDefault();
        const [latitude, longitude] = selectedPosition;
        const {name, email, whatsapp} = formData;
        const items = selectedItems;
        const city = selectedCity;
        const uf = selectedUF;
        
        const data = {name, email, whatsapp, uf, city, latitude, longitude, items};
        
        await api.post('/points', data);
        alert('Ponto cadastrado com sucesso!');

        history.push('/');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>
                <Link to="/">
                    <FiArrowLeft /> Voltar para o Início
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do<br/>ponto de coleta</h1>
                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input 
                            type="text"
                            id="name"
                            name="name"
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input 
                                type="email"
                                id="email"
                                name="email"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input 
                                type="text"
                                id="whatsapp"
                                name="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <span>Selecione o endereço no mapa</span>
                        <h2>Endereço</h2>
                    </legend>

                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={selectedPosition} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select name="uf" id="uf" onChange={handleSelectUF}>
                                <option value="0">Selecione uma UF</option>
                                {UFs.map(UF => (
                                    <option key={UF.sigla} value={UF.sigla}>{UF.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" onChange={handleSelectCity}>
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.nome}>{city.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <span>Selecione um ou mais itens abaixo</span>
                        <h2>Ítens de Coleta</h2>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => (
                        <li 
                            key={item.id} 
                            onClick={()=>handleSelectItem(item.id)}
                            className={selectedItems.includes(item.id) ? 'selected' : ''}>
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                        </li>
                        ))}
                    </ul>
                </fieldset>
                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    );
}

export default CreatePoint;