import Usuario from "../model/Usuario.js";

import { type Request, type Response } from "express";

import type UsuarioDTO from "../dto/UsuarioDTO.js";

class UsuarioController extends Usuario {
    static async todos(req: Request, res: Response) {
        try {
            const listaDeUsuarios = await Usuario.listarUsuarios();

            if (listaDeUsuarios.length === 0) {
                res.status(204).send();
                return;
            }

            res.status(200).json(listaDeUsuarios);
        } catch (error) {
            console.error(`[UsuarioController] Erro ao listar usuários: ${error}`);
            res.status(500).json({ mensagem: "Erro interno ao recuperar a lista de usuários." });
        }
    }

    static async cadastrar(req: Request, res: Response) {
        try {
            console.info(`req.body: ${req.body}`);
            const dadosRecebidos: UsuarioDTO = req.body;
            console.info(`dados recebidos: ${dadosRecebidos}`);

            if (!dadosRecebidos.nome || !dadosRecebidos.email) {
                res.status(400).json({ mensagem: "Campos obrigatórios ausentes: nome, email" });
                return;
            }

            const result = await Usuario.cadastrarUsuario(dadosRecebidos);

            if (result) {
                res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!" });
            } else {
                res.status(400).json({ mensagem: "Não foi possível cadastrar o usuário" });
            }
        } catch (error) {
            console.error(`[UsuarioController] Erro ao cadastrar usuário: ${error}`);
            res.status(500).json({ mensagem: "Erro interno ao cadastrar usuário." });
        }
    }
}

export default UsuarioController;