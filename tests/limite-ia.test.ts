import { beforeAll, describe, expect, it } from "vitest";
import { USUARIO_1, USUARIO_2, criarBanco } from "./banco";

let banco: Awaited<ReturnType<typeof criarBanco>>;
const consumir = (userId: string) =>
  banco.como<{ restantes: number }>("authenticated", userId, "select public.consumir_leitura_ia() as restantes").then((r) => r[0].restantes);

beforeAll(async () => {
  banco = await criarBanco();
}, 60_000);

describe("limite diário de leituras com IA", () => {
  it("permite 10 leituras por dia e bloqueia a 11ª", async () => {
    const restantes: number[] = [];
    for (let i = 0; i < 11; i++) restantes.push(await consumir(USUARIO_1));
    expect(restantes).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1]);
  });

  it("o limite é por usuário", async () => {
    expect(await consumir(USUARIO_2)).toBe(9);
  });

  it("o servidor devolve uma leitura quando a falha foi do provedor", async () => {
    await banco.como("service_role", null, "select public.devolver_leitura_ia($1)", [USUARIO_1]);
    expect(await consumir(USUARIO_1)).toBe(0);
    expect(await consumir(USUARIO_1)).toBe(-1);
  });

  it("o usuário não consegue devolver leituras nem mexer no contador", async () => {
    await expect(banco.como("authenticated", USUARIO_1, "select public.devolver_leitura_ia($1)", [USUARIO_1])).rejects.toThrow(/permission denied/);
    await expect(banco.como("authenticated", USUARIO_1, "update public.ia_uso set leituras = 0")).rejects.toThrow(/permission denied/);
    await expect(banco.como("authenticated", USUARIO_1, "delete from public.ia_uso")).rejects.toThrow(/permission denied/);
  });

  it("cada um só vê o próprio uso", async () => {
    const linhas = await banco.como<{ user_id: string }>("authenticated", USUARIO_2, "select user_id from public.ia_uso");
    expect(linhas.map((l) => l.user_id)).toEqual([USUARIO_2]);
  });

  it("visitante sem login não consome leituras", async () => {
    await expect(banco.como("anon", null, "select public.consumir_leitura_ia()")).rejects.toThrow(/permission denied/);
  });
});

describe("consentimento para a leitura com IA", () => {
  it("o usuário registra e vê só o próprio aceite", async () => {
    await banco.como("authenticated", USUARIO_1, "insert into public.ia_consentimentos default values");
    expect(await banco.como("authenticated", USUARIO_1, "select 1 from public.ia_consentimentos")).toHaveLength(1);
    expect(await banco.como("authenticated", USUARIO_2, "select 1 from public.ia_consentimentos")).toHaveLength(0);
  });

  it("não dá para registrar aceite em nome de outra pessoa", async () => {
    await expect(
      banco.como("authenticated", USUARIO_2, "insert into public.ia_consentimentos (user_id) values ($1)", [USUARIO_1]),
    ).rejects.toThrow(/row-level security|duplicate key/);
  });

  it("excluir a conta apaga consentimento e uso", async () => {
    await banco.como("authenticated", USUARIO_1, "select public.excluir_minha_conta()");
    const [{ n }] = await banco.como<{ n: number }>(
      "service_role",
      null,
      `select (select count(*) from public.ia_uso where user_id = $1) + (select count(*) from public.ia_consentimentos where user_id = $1) as n`,
      [USUARIO_1],
    );
    expect(Number(n)).toBe(0);
  });
});
