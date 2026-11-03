namespace FC2026.World
{
    /// <summary>
    /// Fictional, region-flavoured name construction. Names are assembled from
    /// syllable banks rather than copied from real players, clubs or sponsors.
    /// </summary>
    public static class WorldNames
    {
        private sealed class NameStyleData
        {
            public readonly string[] GivenStart;
            public readonly string[] GivenEnd;
            public readonly string[] FamilyNames;
            public readonly string[] ClubSuffixes;

            public NameStyleData(string givenStart, string givenEnd, string familyNames, string clubSuffixes)
            {
                GivenStart = givenStart.Split(',');
                GivenEnd = givenEnd.Split(',');
                FamilyNames = familyNames.Split(',');
                ClubSuffixes = clubSuffixes.Split(',');
            }
        }

        private static readonly NameStyleData[] Styles =
        {
            new(
                "Al,Ed,Har,Ol,Ja,Le,Mi,Na,To,Wil,Ca,De,Fr,Ge,Ha,Jo",
                "den,son,ton,an,en,ie,ey,ard,ell,y,on,er",
                "Ashford,Blackwood,Bramley,Carter,Dalton,Fairbanks,Greaves,Hartley,Kingsley,Marsh,Northwood,Redfern,Stone,Westbrook,Whitaker,Woodrow",
                "FC,United,City,Athletic,Rovers,Wanderers,Town,Sporting"),
            new(
                "Ale,And,Car,Die,Edu,Fer,Gon,Ig,Jor,Luc,Man,Mat,Nic,Raf,San,Seb",
                "dro,res,lo,go,ardo,nando,iel,an,ico,uel,o,a",
                "Alvarez,Barrios,Castilla,Delgado,Escobar,Ferraro,Gutierrez,Herrera,Ibarra,Lara,Montoya,Navarro,Ojeda,Peralta,Rivera,Salazar",
                "CF,Atletico,Deportivo,Racing,Union,Sporting"),
            new(
                "Jo,Luc,Raf,Thi,Bru,Ga,Mar,Ped,Vin,Enz,Igo,Dav",
                "o,inho,el,as,ao,ique,andro,iel,io,ao,u,er",
                "Silva,Oliveira,Costa,Santos,Ferreira,Almeida,Ribeiro,Cardoso,Moreira,Nascimento,Mendes,Barbosa,Tavares,Rocha,Dias,Lima",
                "FC,Sporting,Atletico,Uniao,Clube,Racing"),
            new(
                "An,Ben,Cle,Dam,Eti,Gab,Hug,Jul,Luc,Mar,Nic,Oli,Pie,Rmi,Theo,Vic",
                "ois,in,ent,ien,ard,on,as,e,ique,ael,ier,an",
                "Bernard,Charpentier,Dubois,Fournier,Garnier,Lemoine,Martin,Moreau,Perrin,Renard,Rousseau,Simon,Thibault,Verdier,Blanchard,Deschamps",
                "FC,Olympique,Sportif,Racing,Union,Athletic"),
            new(
                "Jan,Luk,Max,Nik,Fel,Jon,Tim,Leo,Mat,Phi,Seb,Emi,Dav,Fab,Sim,Vin",
                "as,cas,ias,an,in,el,es,er,o,us,ens,ar",
                "Bergmann,Brandner,Dietrich,Eisenberg,Falkner,Fuchs,Graf,Hartmann,Hoffmann,Keller,Kramer,Lehmann,Muller,Richter,Schneider,Wolf",
                "FC,SV,Sportverein,Athletik,Union,Racing"),
            new(
                "Ja,Se,Du,Ru,Ti,Br,Ko,Lo,Ma,Ni,Pe,St,Th,Wi,Ba,Jo",
                "n,s,t,rt,k,o,e,an,in,el,en,is",
                "Van Bergen,Van Dalen,Van Horst,Van Kessel,Van Marle,Van Rossum,Van Steen,Van Velsen,Van Wijk,Van Zand,Bergman,Dallinga,Evers,Hoekstra,Smit,Visser",
                "FC,SC,Sporting,Union,Racing,Athletiek"),
            new(
                "An,Bj,Ca,El,Er,Ha,Jo,Ka,La,Ma,Ni,Ol,Si,To,Vi,As",
                "ar,er,in,as,e,il,ur,and,iel,or,en,ild",
                "Bergsen,Dahl,Eriksen,Fjell,Grenholm,Holm,Jonsson,Karlsen,Lindberg,Nordahl,Sandvik,Strom,Sundberg,Vik,Ahlgren,Myrberg",
                "IF,BK,FC,Sporting,United,Athletic"),
            new(
                "Ale,And,Ant,Cesa,Dan,Dav,Emil,Fab,Gia,Lor,Luc,Mar,Mat,Nic,Pie,Sim",
                "o,io,co,no,re,ri,zo,do,ni,le,mo,tto",
                "Barone,Bellini,Bosco,Conti,Ferraro,Gallo,Lombardi,Mancini,Marchetti,Ricci,Rossi,Santoro,Ventura,Vitale,Moretti,Caselli",
                "FC,Calcio,Sporting,Unione,Atletico,Racing"),
            new(
                "Alek,Bor,Dmi,Iva,Kon,Mik,Nik,Olek,Pav,Ser,Vla,Yur,Ana,Kat,Nat,Son",
                "andr,ei,an,il,ov,ich,islav,olai,imir,ena,ina,a",
                "Ivanov,Kovalenko,Morozov,Novak,Pavlov,Petrov,Sokolov,Volkov,Zaytsev,Mikhailov,Markov,Kral,Horak,Dvorak,Prochazka,Svoboda",
                "FK,SK,Sporting,Union,Athletic,Racing"),
            new(
                "An,Bo,Da,Fil,Gor,Iv,La,Ma,Mi,Nik,Pe,Ra,St,To,Vl,Zor",
                "an,ar,en,o,ica,ija,e,im,ir,ko,on,ic",
                "Jovanovic,Petrovic,Nikolic,Markovic,Stojanovic,Radic,Milosevic,Kovacevic,Popovic,Ilic,Vasic,Simic,Pavlovic,Jankovic,Tomic,Duric",
                "FK,SK,Sporting,Union,Athletic,Racing"),
            new(
                "Ale,Ana,Chr,Dim,Ele,Geo,Ion,Kos,Nik,Pan,Spyr,Than,Vas,Kat,Mar,Sta",
                "is,os,as,a,ia,ios,eas,o,oula,ena",
                "Alexopoulos,Anastasiou,Christakis,Dimopoulos,Economou,Fotiadis,Georgiou,Ioannidis,Kostas,Lambros,Michailidis,Nikolaidis,Papadakis,Sarantis,Stavrou,Vasiliou",
                "FC,Athlitikos,Enosis,Sporting,Union"),
            new(
                "Al,Ba,Ca,De,Em,Fa,Ha,Ka,Le,Me,Mu,Ni,Or,Se,Ta,Yi",
                "i,an,ar,er,et,il,in,iz,ol,un,us,han",
                "Akar,Alpay,Aydin,Baser,Caner,Demir,Dogan,Erdem,Guler,Karan,Korkmaz,Ozkan,Polat,Sahin,Tekin,Yilmaz",
                "FK,SK,Sporting,Union,Athletic"),
            new(
                "Ab,Ad,Ah,Am,An,As,Fa,Ha,Ib,Is,Ka,Ma,Mo,Na,Om,Sa,Ya,Za",
                "ed,ad,ir,im,an,ar,al,in,id,am,oub,i",
                "El Amrani,El Baraka,El Haddad,El Khalil,El Mansour,El Nasser,Al Amin,Al Hakim,Al Karim,Al Mounir,Al Rashid,Al Sabri,Al Tawil,Ben Ali,Ben Salem,Ben Youssef",
                "FC,SC,Sporting,Union,Club,Racing"),
            new(
                "Ar,Ba,Da,Far,Ha,Hos,Ka,Ma,Meh,Na,Omi,Par,Re,Sa,Sha,Ya",
                "ad,an,ar,ed,in,ir,yar,dad,mad,ra,na,ia",
                "Ahmadi,Bagheri,Dehghani,Ebrahimi,Farhadi,Golestani,Hashemi,Jafari,Karimi,Moradi,Nasiri,Rahimi,Sadeghi,Tehrani,Yazdani,Zand",
                "FC,SC,Sporting,Union,Athletic"),
            new(
                "Ade,Ayo,Chi,Eme,Fem,Ibr,Ike,Keh,Kwam,Obi,Ola,Sey,Tai,Uch,Yaw,Zub",
                "a,i,o,u,ak,an,ar,en,on,us,ay,is",
                "Adeyemi,Akande,Balogun,Diallo,Eze,Gbadamosi,Ikorodu,Kamara,Mensah,Nwosu,Obi,Okafor,Osei,Sanni,Toure,Yusuf",
                "FC,United,City,Sporting,Stars,Rovers"),
            new(
                "Ama,Bar,Cha,Daud,El,Fau,Ham,Jum,Kha,Mwa,Nai,Ochi,Raj,Sam,Tes,Zaw",
                "a,i,o,u,an,ar,el,en,ia,is,ka,lo",
                "Abdalla,Achieng,Barasa,Chepngetich,Kamau,Kiprono,Makanga,Mwangi,Ndegwa,Njeri,Ochieng,Omondi,Senzoga,Wakabi,Wamala,Yusuf",
                "FC,United,City,Sporting,Stars,United"),
            new(
                "Bo,Da,Fa,Gi,Ka,Le,Lu,Ma,Ne,No,Si,Ta,Th,We,Za,Zw",
                "a,o,i,e,an,ar,en,is,ile,and,aba,ini",
                "Dlamini,Khumalo,Mahlangu,Mabuza,Modise,Ndlovu,Ngcobo,Nkosi,Ntuli,Nyathi,Sithole,Swart,Tembo,Zwane,Zulu,Maseko",
                "FC,United,City,Sporting,Stars,Rovers"),
            new(
                "Aki,Da,Ha,Hi,Ka,Ke,Ma,Mi,Na,Ry,Sa,Shi,Ta,Yu,Yui,So",
                "ki,ta,ro,to,ko,na,mi,ya,ru,shi,ka,ho",
                "Amano,Fujita,Harada,Kawano,Mori,Nakamura,Okada,Sato,Takahashi,Yamamoto,Nishimura,Sakamoto,Kuroda,Hoshino,Asano,Tanabe",
                "FC,United,City,Athletic,Sporting"),
            new(
                "Ji,Min,Seo,Yu,Ha,Do,Jun,Hyun,Soo,Eun,Tae,Woo",
                "n,ng,o,a,e,in,un,on,hyun,jin",
                "Kim,Lee,Park,Choi,Jung,Kang,Cho,Yoon,Jang,Lim,Han,Shin,Seo,Kwon,Hwang,Oh",
                "FC,United,City,Sporting,Stars"),
            new(
                "We,Ji,Ha,Yu,Xi,Li,Zh,Qi,Fa,Gu,Me,Ti",
                "wei,jian,hao,yu,ming,lei,qiang,xin,yang,lan,hui,tao",
                "Wang,Li,Zhang,Liu,Chen,Yang,Huang,Zhao,Wu,Zhou,Xu,Sun,Ma,Zhu,Hu,Guo",
                "FC,United,City,Athletic,Sporting"),
            new(
                "An,Ba,Ch,Da,Ha,Ka,La,Ma,Na,Ph,Ra,Sa,Ta,Th,Vi,Yu",
                "an,ar,at,en,in,on,ung,ai,ay,ia,wa,i",
                "Ang,Bakri,Chandra,Duan,Gunawan,Hadi,Kason,Lim,Manalo,Nguyen,Ong,Pham,Rama,Santoso,Tan,Wijaya",
                "FC,United,City,Sporting,Stars"),
            new(
                "Aar,Ad,Ak,Am,An,Ar,Dev,Har,Ish,Kav,Kir,Man,Nik,Raa,Raj,San,Vik",
                "av,it,an,ar,il,ish,eel,osh,ay,ir,un,ya",
                "Aggarwal,Banerjee,Chandra,Dhawan,Gupta,Jain,Kapoor,Khan,Kumar,Malhotra,Mehta,Nair,Patel,Sharma,Singh,Verma",
                "FC,United,City,Sporting,Stars"),
            new(
                "Ari,Kai,Lua,Mana,Moa,Nia,Rau,Sio,Tai,Te,Tui,Vai",
                "a,i,o,an,ar,ea,ka,moa,ra,u,ana,iti",
                "Faletau,Kalani,Latu,Mahu,Nga,Rata,Sefo,Tala,Tuilagi,Vaka,Wai,Yala,Moana,Kimoana,Ariki,Tavita",
                "FC,United,City,Sporting,Stars")
        };

        public static string PersonName(NameStyle style, DeterministicRandom random)
        {
            var data = Styles[(int)style];
            var first = Capitalize(random.Pick(data.GivenStart) + random.Pick(data.GivenEnd));
            var last = Capitalize(random.Pick(data.FamilyNames));
            return first + " " + last;
        }

        public static string CityName(NameStyle style, DeterministicRandom random)
        {
            var data = Styles[(int)style];
            return Capitalize(random.Pick(data.GivenStart) + random.Pick(data.GivenEnd));
        }

        public static string ClubSuffix(NameStyle style, DeterministicRandom random)
        {
            return random.Pick(Styles[(int)style].ClubSuffixes);
        }

        public static int StyleCount => Styles.Length;

        private static string Capitalize(string value)
        {
            if (string.IsNullOrEmpty(value))
                return value;
            return char.ToUpperInvariant(value[0]) + value.Substring(1);
        }
    }
}
