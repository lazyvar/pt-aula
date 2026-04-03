# Unconjugated Verbs Category Redesign

## Summary

Replace the current mixed "verbs" category (20 cards) with 6 frequency-tiered categories of 50 unconjugated verbs each (300 total), under a new "Verbs" group.

## Card Format

Simple infinitive-to-English:
- **PT**: Fazer
- **EN**: To do / To make

No verb type annotations, no conjugated forms.

## Categories

All categories use `group_name: "Verbs"`.

| Category | ID | CSS Class | Count |
|---|---|---|---|
| Essential | `verbs-essential` | `cat-verbs-essential` | 50 |
| Common | `verbs-common` | `cat-verbs-common` | 50 |
| Everyday | `verbs-everyday` | `cat-verbs-everyday` | 50 |
| Practical | `verbs-practical` | `cat-verbs-practical` | 50 |
| Expanding | `verbs-expanding` | `cat-verbs-expanding` | 50 |
| Advanced | `verbs-advanced` | `cat-verbs-advanced` | 50 |

## Changes to Existing Data

- **Remove**: the `verbs` category (id: `verbs`, 20 cards) from seed-data.js
- **Remove**: the `verbs` entry from the categories array
- **Add**: 6 new category entries to the categories array
- **Add**: 300 new card entries to the cards array
- Existing conjugation categories (fazer-conj, ser-conj, etc.) remain unchanged

## Verb Lists

### Tier 1: Essential (verbs-essential)

| # | PT | EN |
|---|---|---|
| 1 | Ser | To be (permanent) |
| 2 | Estar | To be (temporary) |
| 3 | Ter | To have |
| 4 | Fazer | To do / To make |
| 5 | Ir | To go |
| 6 | Poder | To be able to / Can |
| 7 | Dizer | To say / To tell |
| 8 | Dar | To give |
| 9 | Saber | To know (facts) |
| 10 | Querer | To want |
| 11 | Ver | To see |
| 12 | Vir | To come |
| 13 | Dever | Should / To owe |
| 14 | Ficar | To stay / To become |
| 15 | Falar | To speak / To talk |
| 16 | Deixar | To leave / To let |
| 17 | Passar | To pass / To spend (time) |
| 18 | Chegar | To arrive |
| 19 | Encontrar | To find / To meet |
| 20 | Pensar | To think |
| 21 | Levar | To take / To carry |
| 22 | Conhecer | To know (people/places) |
| 23 | Precisar | To need |
| 24 | Começar | To start / To begin |
| 25 | Pedir | To ask for / To order |
| 26 | Parecer | To seem / To appear |
| 27 | Acreditar | To believe |
| 28 | Olhar | To look |
| 29 | Chamar | To call |
| 30 | Trabalhar | To work |
| 31 | Comer | To eat |
| 32 | Beber | To drink |
| 33 | Dormir | To sleep |
| 34 | Morar | To live (reside) |
| 35 | Esperar | To wait / To hope |
| 36 | Gostar | To like |
| 37 | Achar | To think / To find |
| 38 | Entender | To understand |
| 39 | Colocar | To put / To place |
| 40 | Perguntar | To ask (a question) |
| 41 | Sentir | To feel |
| 42 | Comprar | To buy |
| 43 | Sair | To leave / To go out |
| 44 | Tomar | To take / To drink |
| 45 | Lembrar | To remember |
| 46 | Voltar | To return / To come back |
| 47 | Acabar | To finish / To end |
| 48 | Ouvir | To hear / To listen |
| 49 | Ler | To read |
| 50 | Escrever | To write |

### Tier 2: Common (verbs-common)

| # | PT | EN |
|---|---|---|
| 51 | Correr | To run |
| 52 | Abrir | To open |
| 53 | Fechar | To close |
| 54 | Pagar | To pay |
| 55 | Vender | To sell |
| 56 | Ajudar | To help |
| 57 | Mudar | To change / To move |
| 58 | Usar | To use |
| 59 | Tentar | To try |
| 60 | Acontecer | To happen |
| 61 | Jogar | To play (games/sports) |
| 62 | Tocar | To touch / To play (music) |
| 63 | Andar | To walk |
| 64 | Viver | To live |
| 65 | Morrer | To die |
| 66 | Perder | To lose |
| 67 | Ganhar | To win / To earn |
| 68 | Seguir | To follow |
| 69 | Criar | To create |
| 70 | Mandar | To send / To order |
| 71 | Receber | To receive |
| 72 | Entrar | To enter |
| 73 | Cair | To fall |
| 74 | Escolher | To choose |
| 75 | Continuar | To continue |
| 76 | Aprender | To learn |
| 77 | Ensinar | To teach |
| 78 | Contar | To count / To tell |
| 79 | Mostrar | To show |
| 80 | Servir | To serve |
| 81 | Trazer | To bring |
| 82 | Por | To put |
| 83 | Tirar | To take off / To remove |
| 84 | Buscar | To search / To pick up |
| 85 | Subir | To go up / To climb |
| 86 | Descer | To go down |
| 87 | Cortar | To cut |
| 88 | Guardar | To keep / To save |
| 89 | Ligar | To call / To turn on |
| 90 | Desligar | To hang up / To turn off |
| 91 | Dirigir | To drive |
| 92 | Parar | To stop |
| 93 | Terminar | To finish / To end |
| 94 | Explicar | To explain |
| 95 | Responder | To answer / To reply |
| 96 | Esquecer | To forget |
| 97 | Cuidar | To take care of |
| 98 | Preocupar | To worry |
| 99 | Acordar | To wake up |
| 100 | Trocar | To exchange / To switch |

### Tier 3: Everyday (verbs-everyday)

| # | PT | EN |
|---|---|---|
| 101 | Prender | To arrest / To attach |
| 102 | Virar | To turn / To become |
| 103 | Manter | To maintain / To keep |
| 104 | Conseguir | To manage / To get |
| 105 | Devolver | To return (something) |
| 106 | Cozinhar | To cook |
| 107 | Lavar | To wash |
| 108 | Limpar | To clean |
| 109 | Nadar | To swim |
| 110 | Viajar | To travel |
| 111 | Descansar | To rest |
| 112 | Vestir | To wear / To dress |
| 113 | Crescer | To grow |
| 114 | Sofrer | To suffer |
| 115 | Rir | To laugh |
| 116 | Chorar | To cry |
| 117 | Gritar | To shout / To scream |
| 118 | Cantar | To sing |
| 119 | Dancar | To dance |
| 120 | Desenhar | To draw |
| 121 | Pintar | To paint |
| 122 | Namorar | To date / To be in a relationship |
| 123 | Casar | To marry |
| 124 | Brigar | To fight / To argue |
| 125 | Abracar | To hug |
| 126 | Beijar | To kiss |
| 127 | Sorrir | To smile |
| 128 | Mentir | To lie |
| 129 | Prometer | To promise |
| 130 | Decidir | To decide |
| 131 | Permitir | To allow / To permit |
| 132 | Proibir | To prohibit / To forbid |
| 133 | Oferecer | To offer |
| 134 | Aceitar | To accept |
| 135 | Recusar | To refuse |
| 136 | Emprestar | To lend |
| 137 | Pegar | To grab / To catch |
| 138 | Jogar fora | To throw away |
| 139 | Quebrar | To break |
| 140 | Consertar | To fix / To repair |
| 141 | Construir | To build |
| 142 | Destruir | To destroy |
| 143 | Empurrar | To push |
| 144 | Puxar | To pull |
| 145 | Carregar | To carry / To charge |
| 146 | Soltar | To release / To let go |
| 147 | Esconder | To hide |
| 148 | Procurar | To look for / To search |
| 149 | Descobrir | To discover / To find out |
| 150 | Cobrir | To cover |

### Tier 4: Practical (verbs-practical)

| # | PT | EN |
|---|---|---|
| 151 | Enviar | To send |
| 152 | Recomendar | To recommend |
| 153 | Sugerir | To suggest |
| 154 | Combinar | To arrange / To match |
| 155 | Marcar | To schedule / To mark |
| 156 | Cancelar | To cancel |
| 157 | Atrasar | To delay / To be late |
| 158 | Demorar | To take long |
| 159 | Aproveitar | To enjoy / To take advantage |
| 160 | Celebrar | To celebrate |
| 161 | Convidar | To invite |
| 162 | Visitar | To visit |
| 163 | Passear | To go for a walk / To stroll |
| 164 | Reservar | To reserve / To book |
| 165 | Alugar | To rent |
| 166 | Gastar | To spend (money) |
| 167 | Economizar | To save (money) |
| 168 | Investir | To invest |
| 169 | Desenvolver | To develop |
| 170 | Melhorar | To improve |
| 171 | Piorar | To worsen |
| 172 | Aumentar | To increase |
| 173 | Diminuir | To decrease |
| 174 | Juntar | To join / To gather |
| 175 | Separar | To separate |
| 176 | Misturar | To mix |
| 177 | Dividir | To divide / To share |
| 178 | Compartilhar | To share |
| 179 | Proteger | To protect |
| 180 | Defender | To defend |
| 181 | Atacar | To attack |
| 182 | Competir | To compete |
| 183 | Treinar | To train |
| 184 | Exercitar | To exercise |
| 185 | Alongar | To stretch |
| 186 | Respirar | To breathe |
| 187 | Tossir | To cough |
| 188 | Espirrar | To sneeze |
| 189 | Doer | To hurt / To ache |
| 190 | Curar | To cure / To heal |
| 191 | Operar | To operate |
| 192 | Examinar | To examine |
| 193 | Pesar | To weigh |
| 194 | Medir | To measure |
| 195 | Comparar | To compare |
| 196 | Organizar | To organize |
| 197 | Planejar | To plan |
| 198 | Preparar | To prepare |
| 199 | Verificar | To verify / To check |
| 200 | Confirmar | To confirm |

### Tier 5: Expanding (verbs-expanding)

| # | PT | EN |
|---|---|---|
| 201 | Imaginar | To imagine |
| 202 | Sonhar | To dream |
| 203 | Desejar | To wish / To desire |
| 204 | Respeitar | To respect |
| 205 | Confiar | To trust |
| 206 | Duvidar | To doubt |
| 207 | Arrepender | To regret |
| 208 | Perdoar | To forgive |
| 209 | Culpar | To blame |
| 210 | Elogiar | To compliment / To praise |
| 211 | Criticar | To criticize |
| 212 | Apoiar | To support |
| 213 | Incentivar | To encourage |
| 214 | Convencer | To convince |
| 215 | Concordar | To agree |
| 216 | Discordar | To disagree |
| 217 | Discutir | To discuss / To argue |
| 218 | Negociar | To negotiate |
| 219 | Exigir | To demand |
| 220 | Insistir | To insist |
| 221 | Avisar | To warn / To notify |
| 222 | Informar | To inform |
| 223 | Anunciar | To announce |
| 224 | Publicar | To publish |
| 225 | Traduzir | To translate |
| 226 | Pronunciar | To pronounce |
| 227 | Soletrar | To spell |
| 228 | Assinar | To sign |
| 229 | Imprimir | To print |
| 230 | Copiar | To copy |
| 231 | Colar | To paste / To glue |
| 232 | Apagar | To erase / To turn off |
| 233 | Salvar | To save |
| 234 | Baixar | To download / To lower |
| 235 | Instalar | To install |
| 236 | Funcionar | To work / To function |
| 237 | Estragar | To break / To ruin |
| 238 | Tropecar | To trip / To stumble |
| 239 | Escorregar | To slip |
| 240 | Derrubar | To knock down / To spill |
| 241 | Derramar | To spill / To pour |
| 242 | Queimar | To burn |
| 243 | Congelar | To freeze |
| 244 | Ferver | To boil |
| 245 | Assar | To roast / To bake |
| 246 | Fritar | To fry |
| 247 | Temperar | To season |
| 248 | Picar | To chop / To sting |
| 249 | Refogar | To saute |
| 250 | Provar | To taste / To prove |

### Tier 6: Advanced (verbs-advanced)

| # | PT | EN |
|---|---|---|
| 251 | Alcancar | To reach / To achieve |
| 252 | Atingir | To reach / To hit |
| 253 | Superar | To overcome |
| 254 | Enfrentar | To face / To confront |
| 255 | Suportar | To endure / To stand |
| 256 | Aguentar | To handle / To bear |
| 257 | Resistir | To resist |
| 258 | Render | To yield / To surrender |
| 259 | Desistir | To give up |
| 260 | Arriscar | To risk |
| 261 | Beneficiar | To benefit |
| 262 | Desperdicar | To waste |
| 263 | Acumular | To accumulate |
| 264 | Espalhar | To spread |
| 265 | Encolher | To shrink |
| 266 | Esticar | To stretch / To extend |
| 267 | Dobrar | To fold / To double |
| 268 | Embrulhar | To wrap |
| 269 | Desembrulhar | To unwrap |
| 270 | Pendurar | To hang |
| 271 | Amarrar | To tie |
| 272 | Desamarrar | To untie |
| 273 | Caber | To fit |
| 274 | Pertencer | To belong |
| 275 | Depender | To depend |
| 276 | Influenciar | To influence |
| 277 | Contribuir | To contribute |
| 278 | Participar | To participate |
| 279 | Colaborar | To collaborate |
| 280 | Liderar | To lead |
| 281 | Obedecer | To obey |
| 282 | Trair | To betray |
| 283 | Enganar | To deceive / To trick |
| 284 | Roubar | To steal / To rob |
| 285 | Deter | To detain / To stop |
| 286 | Fugir | To flee / To escape |
| 287 | Perseguir | To chase / To pursue |
| 288 | Investigar | To investigate |
| 289 | Comprovar | To prove / To confirm |
| 290 | Testemunhar | To witness |
| 291 | Jurar | To swear |
| 292 | Herdar | To inherit |
| 293 | Envelhecer | To age / To grow old |
| 294 | Amadurecer | To mature / To ripen |
| 295 | Adoecer | To get sick |
| 296 | Emagrecer | To lose weight |
| 297 | Engordar | To gain weight |
| 298 | Fortalecer | To strengthen |
| 299 | Enfraquecer | To weaken |
| 300 | Transformar | To transform |
