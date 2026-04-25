import type UsuarioDTO from "../dto/UsuarioDTO.js";
import { DatabaseModel } from "./DatabaseModel.js";

const database = new DatabaseModel().pool;

class Usuario {
    private id_usuario: number = 0;
    private nome: string;
    private email: string;
    private senha: string = '';
    private role: string = 'admin';

    constructor(
        _nome: string,
        _email: string,
        _senha?: string,
        _role?: string
    ) {
        this.nome = _nome;
        this.email = _email;
        this.senha = _senha ?? this.nome;
        this.role = _role ?? 'admin';
    }

    public getIdUsuario(): number { return this.id_usuario; }
    public setIdUsuario(id_usuario: number): void { this.id_usuario = id_usuario; }

    public getNome(): string { return this.nome; }
    public setNome(nome: string): void { this.nome = nome; }

    public getEmail(): string { return this.email; }
    public setEmail(email: string): void { this.email = email; }

    protected getSenha(): string { return this.senha; }
    protected setSenha(senha: string): void { this.senha = senha; }

    protected getRole(): string { return this.role; }
    protected setRole(role: string) { this.role = role; }

    private static toDTO(usuario: any): UsuarioDTO {
        return {
            id_usuario: usuario.id_usuario,
            nome: usuario.nome,
            email: usuario.email,
            role: usuario.role
        };
    }

    // criar listagem usuários
    static async listarUsuarios(): Promise<UsuarioDTO[]> {
        try {
            const query = `SELECT id_usuario, nome, email, role FROM usuario;`
            const respostaBD = await database.query(query);

            return respostaBD.rows.map(Usuario.toDTO);
        } catch (error) {
            console.error(`[UsuarioModel] Erro ao listar usuários. ${error}`);
            throw error;
        }
    }

    static async cadastrarUsuario(usuario: UsuarioDTO): Promise<boolean> {
        try {
            const queryInsertUsuario = `
                INSERT INTO usuario (nome, email, senha, role)
                VALUES ($1, $2, $3, $4)
                RETURNING id_usuario;
            `;

            const valoresUsuario = [
                usuario.nome.toUpperCase(),
                usuario.email.toLowerCase(),
                usuario.senha,
                'admin'
            ]

            const resultUsuario = await database.query(queryInsertUsuario, valoresUsuario);

            if (resultUsuario.rows.length === 0) {
                throw new Error('INSERT de usuario não retornou dados - cadastro pode ter falhado silenciosamente.');
            }

            const id_usuario = resultUsuario.rows[0];

            console.info(`[UsuarioModel] Usuário cadastrado. ID ${id_usuario}`);

            return true;
        } catch (error) {
            console.error(`[UsuarioModel] Erro ao cadastrar usuário. ${error}`);
            throw error;
        }
    }
}

export default Usuario;