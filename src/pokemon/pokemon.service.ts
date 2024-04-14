import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { Model, isValidObjectId } from 'mongoose';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name) private readonly pokemonModel: Model<Pokemon>,
  ) {}
  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      if (!pokemon)
        throw new NotFoundException('No se pudo crear este pokemon');
      return pokemon.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(
          `Pokemon existe en la base de datos ${JSON.stringify(
            error.keyValue,
          )}`,
        );
      }
      console.log(error);
      throw new InternalServerErrorException('No se pudo crear el pohemon');
    }
  }

  async findAll() {
    const allPokemons = await this.pokemonModel.find();
    if (!allPokemons || allPokemons.length === 0)
      throw new NotFoundException('No se encontraron pokemones disponibles');
    return allPokemons;
  }

  async findOne(id: string) {
    let pokemon: Pokemon;

    if (!isNaN(+id)) {
      pokemon = await this.pokemonModel.findOne({ no: id });
    }

    if (isValidObjectId(id)) {
      pokemon = await this.pokemonModel.findById(id);
    }

    if (!pokemon)
      throw new NotFoundException('No se encontro el pokemon seleccionado');

    return pokemon;
  }

  async update(id: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(id);
    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    }

    try {
      await pokemon.updateOne(updatePokemonDto, { new: true });

      return {
        ...pokemon.toJSON(),
        ...updatePokemonDto,
      };
    } catch (error) {
      console.log(error);
      if (error.code === 11000) {
        throw new BadRequestException(
          `El nombre ${updatePokemonDto.name} o el numero ${updatePokemonDto.no} ya existe en un pokemon en la BD`,
        );
      }
      throw new InternalServerErrorException(
        'Hubo un error interno en el servidor',
      );
    }
  }

  async remove(id: string) {
    /* const pokemon = await this.findOne(id);
    await pokemon.deleteOne(); */

    const result = await this.pokemonModel.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      throw new BadRequestException(
        `No se encontro el pokemon con el id:${id} en la base de datos`,
      );
    }

    let confirm: any;

    if (result.deletedCount === 1) {
      confirm = 'Pokemon eliminado exitosamente';
    }

    return confirm;
  }
}
