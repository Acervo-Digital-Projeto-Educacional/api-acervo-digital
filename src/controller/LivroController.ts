import Livro from "../model/Livro.js";
import { type Request, type Response } from "express";
import type LivroDTO from "../dto/LivroDTO.js";

class LivroController extends Livro {
    static async todos(req: Request, res: Response) {
        try {
            const listaDeLivros = await Livro.listarLivros();
            return res.status(200).json(listaDeLivros);
        } catch (error) {
            console.error(`Erro ao listar livros: ${error}`);
            return res.status(500).json({ mensagem: "Erro ao recuperar as informações dos livros." });
        }
    }

    static async livro(req: Request, res: Response) {
        try {
            const idLivro = parseInt(req.params.id as string);

            const livro = await Livro.listarLivro(idLivro);
            res.status(200).json(livro);
        } catch (error) {
            console.log(`Erro ao acessar método herdado: ${error}`);    // Exibe erros da consulta no console
            res.status(500).json("Erro ao recuperar as informações do livro.");  // Retorna mensagem de erro com status code 400
        }
    }

    static async cadastrar(req: Request, res: Response) {
        try {
            const dadosRecebidos: LivroDTO = req.body;

            const novoLivro = new Livro(
                dadosRecebidos.titulo,
                dadosRecebidos.autor,
                dadosRecebidos.editora,
                (dadosRecebidos.ano_publicacao ?? 0).toString(),
                dadosRecebidos.isbn,
                dadosRecebidos.quant_total,
                dadosRecebidos.quant_disponivel,
                dadosRecebidos.quant_aquisicao,
                dadosRecebidos.valor_aquisicao ?? 0
            );

            const result = await Livro.cadastrarLivro(novoLivro);

            if (result) {
                return res.status(200).json({ mensagem: 'Livro cadastrado com sucesso.' });
            } else {
                return res.status(500).json({ mensagem: 'Não foi possível cadastrar o livro no banco de dados.' });
            }
        } catch (error) {
            console.error(`Erro ao cadastrar o livro: ${error}`);
            return res.status(500).json({ mensagem: 'Erro ao cadastrar o livro.' });
        }
    }

    static async remover(req: Request, res: Response): Promise<Response> {
        try {
            const idLivro = parseInt(req.params.id_livro as string);

            const result = await Livro.removerLivro(idLivro);

            if (result) {
                return res.status(201).json({ mensagem: 'Livro removido com sucesso.' });
            } else {
                return res.status(404).json({ mensagem: 'Livro não encontrado para exclusão.' });
            }
        } catch (error) {
            console.error("Erro ao remover o livro: ", error);
            return res.status(500).json({ mensagem: 'Erro ao remover o livro.' });
        }
    }

    static async atualizar(req: Request, res: Response): Promise<Response> {
        try {
            const idLivro = parseInt(req.params.id_livro as string);

            const dadosRecebidos: LivroDTO = req.body;

            const livro = new Livro(
                dadosRecebidos.titulo,
                dadosRecebidos.autor,
                dadosRecebidos.editora,
                (dadosRecebidos.ano_publicacao ?? 0).toString(),
                dadosRecebidos.isbn,
                dadosRecebidos.quant_total,
                dadosRecebidos.quant_disponivel,
                dadosRecebidos.quant_aquisicao,
                dadosRecebidos.valor_aquisicao ?? 0
            );

            livro.setIdLivro(idLivro);

            const sucesso = await Livro.atualizarLivro(livro);

            if (sucesso) {
                return res.status(200).json({ mensagem: "Cadastro atualizado com sucesso!" });
            } else {
                return res.status(400).json({ mensagem: "Não foi possível atualizar o livro no banco de dados." });
            }
        } catch (error) {
            console.error(`Erro ao atualizar livro: ${error}`);
            return res.status(500).json({ mensagem: "Erro ao atualizar o livro." });
        }
    }
}

export default LivroController;