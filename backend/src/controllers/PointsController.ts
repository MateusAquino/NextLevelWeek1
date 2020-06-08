import { Request, Response } from 'express';
import knex from '../database/connection';

class PointsController {
    async create(req: Request, res: Response) {
        const {image, name, email, whatsapp, latitude, longitude, city, uf, items} = req.body;
        const trx = await knex.transaction();
    
        // Insert Point
        const tmp_img = "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60";
        const point = {image: tmp_img, name, email, whatsapp, latitude, longitude, city, uf};
        const insertedIds = await trx('points').insert(point);
        
        // Assoc. Items to point
        const point_id = insertedIds[0];
        const pointItems = items.map((item_id: number)=>{
            return { item_id, point_id }
        });
        await trx('point_item').insert(pointItems);
        
        await trx.commit();

        return res.json({id:point_id,...point});
    };

    async show(req: Request, res: Response) {
        const {id} = req.params;
        const point = await knex('points').where('id', id).first();
        const items = await knex('items')
            .join('point_item', 'items.id', '=', 'point_item.item_id')
            .where('point_item.point_id', id)
            .select('items.title');

        return !point ? res.status(404).json({message: 'Point not found.'}) : res.json({point, items});
    };

    async index(req: Request, res: Response) {
        const { city, uf, items } = req.query;
        const parsedItems = String(items)
            .split(',')
            .map(i=>{return Number(i.trim())});
        
        const points = await knex('points')
            .join('point_item', 'points.id', '=', 'point_item.point_id')
            .whereIn('point_item.item_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('points.*');

        return res.json(points);
    }
}

export default PointsController;