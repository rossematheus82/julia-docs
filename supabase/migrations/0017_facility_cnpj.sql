-- Estabelecimentos: CNPJ para constar na receita médica.
-- A receita voltava do CEAF por não trazer endereço nem CNPJ do estabelecimento
-- (apenas o CNES). O CNPJ passa a ser cadastrado (manualmente ou via consulta
-- ao CNES/DataSUS) e impresso no cabeçalho da prescrição.

alter table public.health_facilities
  add column if not exists cnpj text;

comment on column public.health_facilities.cnpj is
  'CNPJ do estabelecimento (somente dígitos ou formatado). Usado no cabeçalho da receita.';
