import 'package:flutter/material.dart';

void main() => runApp(const FC2026App());

class Player {
  final String name, shortName, position;
  final int rating, pace, shooting, passing;
  const Player(this.name, this.shortName, this.position, this.rating, this.pace,
      this.shooting, this.passing);
}

const squad = <Player>[
  Player('Ederson', 'Ederson', 'GK', 89, 62, 25, 88),
  Player('João Cancelo', 'Cancelo', 'LB', 86, 89, 65, 86),
  Player('Rúben Dias', 'Rúben Dias', 'CB', 88, 71, 42, 82),
  Player('John Stones', 'Stones', 'CB', 85, 72, 52, 81),
  Player('Kyle Walker', 'Walker', 'RB', 84, 92, 54, 76),
  Player('Rodri', 'Rodri', 'CM', 91, 68, 82, 94),
  Player('Kevin De Bruyne', 'De Bruyne', 'CM', 90, 74, 91, 95),
  Player('Bernardo Silva', 'Bernardo', 'CAM', 88, 82, 79, 91),
  Player('Jack Grealish', 'Grealish', 'LW', 86, 84, 78, 87),
  Player('Erling Haaland', 'Haaland', 'ST', 93, 89, 96, 78),
  Player('Phil Foden', 'Foden', 'RW', 88, 91, 86, 88),
];

class FC2026App extends StatelessWidget {
  const FC2026App({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: ThemeData.dark(useMaterial3: true)
            .copyWith(scaffoldBackgroundColor: const Color(0xFF070B13)),
        home: const SquadHomePage(),
      );
}

class SquadHomePage extends StatefulWidget {
  const SquadHomePage({super.key});
  @override
  State<SquadHomePage> createState() => _SquadHomePageState();
}

class _SquadHomePageState extends State<SquadHomePage> {
  int selected = 9;
  int nav = 0;
  String page = 'home';
  void openPage(String next) => setState(() => page = next);
  final positions = const <Offset>[
    Offset(.50, .88),
    Offset(.15, .69),
    Offset(.38, .73),
    Offset(.62, .73),
    Offset(.85, .69),
    Offset(.29, .49),
    Offset(.50, .55),
    Offset(.71, .49),
    Offset(.18, .24),
    Offset(.50, .18),
    Offset(.82, .24),
  ];
  final positionNames = const [
    'GK',
    'LB',
    'CB',
    'CB',
    'RB',
    'CM',
    'CM',
    'CAM',
    'LW',
    'ST',
    'RW'
  ];

  void toast(String text) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(text),
          behavior: SnackBarBehavior.floating,
          backgroundColor: const Color(0xFF193A28)));

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    return Scaffold(
      body: SafeArea(
          child: Column(children: [
        _topBar(),
        Expanded(
          child: page == 'home'
              ? SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(16, 22, 16, 28),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1200),
                      child: _dashboard(),
                    ),
                  ),
                )
              : GameModePage(
                  mode: page, onBack: () => openPage('home'), onToast: toast),
        ),
        _bottomNav(),
      ])),
    );
  }

  Widget _topBar() => LayoutBuilder(builder: (context, constraints) {
        final compact = constraints.maxWidth < 390;
        return Container(
          padding: EdgeInsets.symmetric(horizontal: compact ? 12 : 18, vertical: 10),
          decoration: const BoxDecoration(
            color: Color(0xF2060B15),
            border: Border(bottom: BorderSide(color: Color(0x334ADDF4))),
          ),
          child: Row(children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                gradient: const LinearGradient(
                  colors: [Color(0xFF37DDF4), Color(0xFF3757C8)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: const [BoxShadow(color: Color(0x6637DDF4), blurRadius: 15)],
              ),
              child: const Icon(Icons.sports_soccer_rounded, color: Color(0xFF06101B), size: 23),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('FC 2026', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1.5)),
                Text(compact ? 'MANAGER 42' : 'MANAGER 42  ·  CLOUD SYNCED',
                  style: const TextStyle(color: Color(0xFF8293AA), fontSize: 8, letterSpacing: .7)),
              ]),
            ),
            _coinPill(),
            const SizedBox(width: 7),
            _roundIcon(Icons.mail_outline, badge: '3', label: 'Messages'),
            if (!compact) ...[
              const SizedBox(width: 5),
              _roundIcon(Icons.notifications_none, label: 'Notifications'),
            ],
            const SizedBox(width: 3),
            _roundIcon(Icons.settings_outlined, label: 'Settings'),
          ]),
        );
      });

  Widget _coinPill() => Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
      decoration: BoxDecoration(
          color: const Color(0x401A291A),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: const Color(0x668E7734))),
      child: const Row(children: [
        Text('◈', style: TextStyle(color: Color(0xFFF0C95B), fontSize: 14)),
        SizedBox(width: 5),
        Text('1.5M',
            style: TextStyle(
                color: Color(0xFFF4D778),
                fontWeight: FontWeight.w900,
                fontSize: 12))
      ]));
  Widget _roundIcon(IconData icon, {String? badge, required String label}) =>
      SizedBox(
        width: 40,
        height: 40,
        child: Stack(clipBehavior: Clip.none, children: [
          IconButton(
            tooltip: label,
            padding: EdgeInsets.zero,
            onPressed: () => toast('$label opened'),
            icon: Icon(icon, size: 18, color: const Color(0xFFA8B7C9)),
            style: IconButton.styleFrom(
              backgroundColor: const Color(0xFF101826),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(11),
                side: const BorderSide(color: Color(0x443B536B)),
              ),
            ),
          ),
          if (badge != null)
            Positioned(
              right: 0,
              top: 0,
              child: CircleAvatar(
                radius: 7,
                backgroundColor: const Color(0xFF37DDF4),
                child: Text(badge, style: const TextStyle(color: Color(0xFF06101B), fontSize: 8, fontWeight: FontWeight.w900)),
              ),
            ),
        ]),
      );

  Widget _dashboard() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.circle, size: 8, color: Color(0xFFFFD166)),
            const SizedBox(width: 8),
            const Text('MATCHDAY 07', style: TextStyle(color: Color(0xFFFFD166), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.8)),
            const SizedBox(width: 10),
            Container(width: 22, height: 1, color: const Color(0xFF4B6078)),
            const SizedBox(width: 10),
            const Text('ELITE DIVISION', style: TextStyle(color: Color(0xFFA6B4C7), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
            const Spacer(),
            const Icon(Icons.wifi, size: 14, color: Color(0xFF37DDF4)),
            const SizedBox(width: 5),
            const Text('ONLINE', style: TextStyle(color: Color(0xFF8293AA), fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
          ]),
          const SizedBox(height: 14),
          LayoutBuilder(builder: (context, constraints) {
            final wide = constraints.maxWidth >= 760;
            final feature = _featuredClub(wide: wide);
            final modes = _modeGrid(constraints.maxWidth);
            if (wide) {
              return SizedBox(
                height: 330,
                child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  Expanded(flex: 11, child: feature),
                  const SizedBox(width: 14),
                  Expanded(flex: 10, child: modes),
                ]),
              );
            }
            return Column(children: [feature, const SizedBox(height: 16), modes]);
          }),
          const SizedBox(height: 18),
          Row(children: [
            Expanded(child: _dashboardFooter(Icons.shield_outlined, 'MY CLUB', 'CITY  ·  4-3-3 FORMATION', () => openPage('squad'))),
            const SizedBox(width: 9),
            Expanded(child: _dashboardFooter(Icons.swap_horiz_rounded, 'TRANSFERS', '3 SCOUT REPORTS', () => openPage('career'))),
          ]),
        ],
      );

  Widget _featuredClub({required bool wide}) => Container(
        height: wide ? double.infinity : 260,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0x6653DFF4), width: 1.2),
          gradient: const LinearGradient(
            colors: [Color(0xFF0D3A63), Color(0xFF101D47), Color(0xFF111629)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: const [BoxShadow(color: Color(0x3318B9E8), blurRadius: 24, offset: Offset(0, 10))],
        ),
        child: Stack(children: [
          Positioned.fill(child: CustomPaint(painter: StadiumGlowPainter())),
          Positioned(right: -28, bottom: -65, child: Icon(Icons.sports_soccer_rounded, size: 240, color: const Color(0x1837DDF4))),
          Positioned(right: 14, top: 14, child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
            decoration: BoxDecoration(color: const Color(0x4437DDF4), borderRadius: BorderRadius.circular(30), border: Border.all(color: const Color(0x6653DFF4))),
            child: const Text('CAREER  ·  SEASON 01', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1.2, color: Color(0xFFB8F4FF))),
          )),
          Positioned(left: wide ? 18 : 14, bottom: 13, child: const Text('FC 2026  •  FOOTBALL, REIMAGINED', style: TextStyle(color: Color(0xFFA6B4C7), fontSize: 7, fontWeight: FontWeight.w900, letterSpacing: 1.2))),
          Padding(
            padding: EdgeInsets.fromLTRB(wide ? 24 : 18, 46, wide ? 24 : 18, 36),
            child: Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.end, children: [
                const Text('DREAM FC', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF53E5F7), letterSpacing: 2.2)),
                const SizedBox(height: 7),
                Text(wide ? 'Own the
season.' : 'Own the season.', style: TextStyle(fontSize: wide ? 38 : 32, height: .98, letterSpacing: -1.6, fontWeight: FontWeight.w900)),
                const SizedBox(height: 8),
                const Text('Build your club. Take the title.', style: TextStyle(color: Color(0xFFB2C0D0), fontSize: 11)),
                const SizedBox(height: 15),
                Align(alignment: Alignment.centerLeft, child: FilledButton.icon(
                  onPressed: () => openPage('career'),
                  icon: const Icon(Icons.play_arrow_rounded, size: 18),
                  label: const Text('CONTINUE CAREER', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                  style: FilledButton.styleFrom(backgroundColor: const Color(0xFF47DFF2), foregroundColor: const Color(0xFF07111D), padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(11))),
                )),
              ])),
              const SizedBox(width: 6),
              Expanded(child: Stack(alignment: Alignment.center, children: [
                Container(width: 130, height: 130, decoration: BoxDecoration(shape: BoxShape.circle, gradient: RadialGradient(colors: [const Color(0x8837DDF4), const Color(0x0037DDF4)]))),
                const Icon(Icons.sports_soccer_rounded, size: 96, color: Color(0xFFD9F8FF)),
                Positioned(top: 4, right: 3, child: Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: const Color(0xFF111B2B), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF53DFF4))), child: const Column(children: [Text('OVR', style: TextStyle(fontSize: 7, color: Color(0xFFA6B4C7), fontWeight: FontWeight.w900)), Text('84', style: TextStyle(color: Color(0xFF53E5F7), fontSize: 22, fontWeight: FontWeight.w900, height: 1.1))]))),
                Positioned(bottom: 11, child: Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), decoration: BoxDecoration(color: const Color(0xCC10192A), borderRadius: BorderRadius.circular(20)), child: const Text('CITY  ·  4-3-3', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: .8)))),
              ])),
            ]),
          ),
        ]),
      );

  Widget _modeGrid(double width) {
    final modes = <(IconData, String, String, Color, String)>[
      (Icons.emoji_events_outlined, 'CAREER', 'Take charge of the club', const Color(0xFF53DFF4), 'career'),
      (Icons.stadium_outlined, 'SCENARIO', 'Change the match story', const Color(0xFFFF70C8), 'tournament'),
      (Icons.bolt_rounded, 'DREAM LEAGUE', 'Climb the divisions', const Color(0xFFFFD166), 'kickoff'),
      (Icons.auto_awesome_outlined, 'DREAM DRAFT', 'Build a winning XI', const Color(0xFF9D8CFF), 'squad'),
      (Icons.sports_soccer_rounded, 'EXHIBITION', 'Play your next match', const Color(0xFF4FDFB2), 'practice'),
      (Icons.groups_2_outlined, 'TEAM', 'Manage your squad', const Color(0xFFFF70C8), 'squad'),
    ];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        const Expanded(child: Text('CHOOSE YOUR MODE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.8))),
        Text('${modes.length} MODES', style: const TextStyle(color: Color(0xFF8293AA), fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
      ]),
      const SizedBox(height: 10),
      GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: modes.length,
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: width < 310 ? 1 : 2, crossAxisSpacing: 9, mainAxisSpacing: 9, mainAxisExtent: 78),
        itemBuilder: (context, index) {
          final (icon, title, subtitle, accent, route) = modes[index];
          return _modeCard(icon, title, subtitle, accent, () => openPage(route));
        },
      ),
    ]);
  }

  Widget _modeCard(IconData icon, String title, String subtitle, Color accent, VoidCallback onTap) => Material(
        color: const Color(0xFF0D1421),
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 10),
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF263449))),
            child: Row(children: [
              Container(width: 40, height: 40, decoration: BoxDecoration(color: accent.withValues(alpha: .13), borderRadius: BorderRadius.circular(12), border: Border.all(color: accent.withValues(alpha: .45))), child: Icon(icon, color: accent, size: 20)),
              const SizedBox(width: 10),
              Expanded(child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: .9)),
                const SizedBox(height: 4),
                Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFF8293AA), fontSize: 8)),
              ])),
              Icon(Icons.arrow_forward_rounded, size: 15, color: accent),
            ]),
          ),
        ),
      );

  Widget _dashboardFooter(IconData icon, String title, String detail, VoidCallback onTap) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(13),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(color: const Color(0xFF0D1421), borderRadius: BorderRadius.circular(13), border: Border.all(color: const Color(0xFF263449))),
          child: Row(children: [
            Icon(icon, color: const Color(0xFF53DFF4), size: 19),
            const SizedBox(width: 9),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
              const SizedBox(height: 3),
              Text(detail, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFF8293AA), fontSize: 7)),
            ])),
            const Icon(Icons.chevron_right, size: 17, color: Color(0xFF8293AA)),
          ]),
        ),
      );

  Widget _hero() => Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
        const Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('●  MATCHDAY 07   ─   ELITE DIVISION',
              style: TextStyle(
                  color: Color(0xFFA3BCAB),
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.6)),
          SizedBox(height: 10),
          Text('Build your\nultimate XI.',
              style: TextStyle(
                  fontSize: 42,
                  height: .94,
                  letterSpacing: -2.2,
                  fontWeight: FontWeight.w900)),
          SizedBox(height: 9),
          Text('Every card. Every decision. Your squad writes the story.',
              style: TextStyle(color: Color(0xFF7C9583), fontSize: 12))
        ])),
        Container(
            width: 64,
            height: 72,
            decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                gradient: const LinearGradient(
                    colors: [Color(0xFF3B7040), Color(0xFF0D271E)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight),
                border: Border.all(color: const Color(0x668DBB68))),
            child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.workspace_premium_outlined,
                      size: 15, color: Color(0xFFD6E9D1)),
                  Text('OVR',
                      style: TextStyle(color: Color(0xFFA7C5A5), fontSize: 8)),
                  Text('84',
                      style: TextStyle(
                          color: Color(0xFF37DDF4),
                          fontWeight: FontWeight.w900,
                          fontSize: 26,
                          height: 1))
                ])),
      ]);

  Widget _squadPanel(double width) => Container(
      decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(25),
          gradient: const LinearGradient(
              colors: [Color(0xD6102B1D), Color(0xF2091C15)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight),
          border: Border.all(color: const Color(0x333F7753)),
          boxShadow: const [
            BoxShadow(
                color: Color(0x44000000), blurRadius: 25, offset: Offset(0, 12))
          ]),
      child: Column(children: [
        Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 14),
            child: Row(children: [
              const Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text('TACTICAL HUB',
                        style: TextStyle(
                            color: Color(0xFFA3BCAB),
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2)),
                    SizedBox(height: 5),
                    Text('CITY  starting XI',
                        style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -.6))
                  ])),
              InkWell(
                  onTap: () => toast('Formation editor opened'),
                  borderRadius: BorderRadius.circular(30),
                  child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                          color: const Color(0x142D5E31),
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(color: const Color(0x4DB9ED4E))),
                      child: const Row(children: [
                        Text('4-3-3',
                            style: TextStyle(
                                color: Color(0xFF37DDF4),
                                fontSize: 11,
                                fontWeight: FontWeight.w900)),
                        Icon(Icons.chevron_right,
                            size: 15, color: Color(0xFF37DDF4))
                      ])))
            ])),
        LayoutBuilder(builder: (_, c) {
          final height = width < 500 ? 445.0 : 520.0;
          return SizedBox(
              height: height,
              child: Stack(children: [
                const Positioned.fill(
                    child: CustomPaint(painter: PitchPainter())),
                ...List.generate(
                    positions.length,
                    (i) => Positioned(
                        left: positions[i].dx * c.maxWidth,
                        top: positions[i].dy * height,
                        child: Transform.translate(
                            offset: Offset(c.maxWidth < 430 ? -24 : -30, c.maxWidth < 430 ? -35 : -42),
                            child: PlayerCard(
                                player: squad[i],
                                selected: selected == i,
                                compact: c.maxWidth < 430,
                                onTap: () => setState(() => selected = i)))))
              ]));
        }),
        Padding(
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 16),
            child: Row(children: [
              const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('TEAM CHEMISTRY',
                        style: TextStyle(
                            color: Color(0xFFA3BCAB),
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5)),
                    SizedBox(height: 3),
                    Text('92 / 100',
                        style: TextStyle(
                            color: Color(0xFF37DDF4),
                            fontWeight: FontWeight.w900,
                            fontSize: 18))
                  ]),
              const SizedBox(width: 14),
              Expanded(
                  child: ClipRRect(
                      borderRadius: BorderRadius.circular(9),
                      child: const SizedBox(
                          height: 5,
                          child: LinearProgressIndicator(
                              value: .92,
                              backgroundColor: Color(0xFF1B3B29),
                              color: Color(0xFF37DDF4))))),
              const SizedBox(width: 14),
              IconButton(
                  onPressed: () => toast('Squad editor opened'),
                  icon: const Icon(Icons.edit_outlined,
                      color: Color(0xFF37DDF4), size: 18))
            ])),
      ]));

  Widget _featureRow() => Row(children: [
        Expanded(
            child: _feature(
                Icons.play_arrow_rounded,
                'READY TO PLAY',
                'Kick-off match',
                const Color(0xFF37DDF4),
                () => openPage('kickoff'))),
        const SizedBox(width: 10),
        Expanded(
            child: _feature(
                Icons.emoji_events_outlined,
                'MANAGER MODE',
                'Continue career',
                const Color(0xFFF1C75B),
                () => openPage('career')))
      ]);
  Widget _feature(IconData icon, String eyebrow, String title, Color accent,
          VoidCallback onTap) =>
      InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: Container(
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  color: const Color(0xB8122C1E),
                  border: Border.all(color: accent.withValues(alpha: .18))),
              child: Row(children: [
                Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                        color: accent, borderRadius: BorderRadius.circular(10)),
                    child:
                        Icon(icon, color: const Color(0xFF070B13), size: 17)),
                const SizedBox(width: 9),
                Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                      Text(eyebrow,
                          style: const TextStyle(
                              color: Color(0xFF8CAD94),
                              fontSize: 7,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1)),
                      const SizedBox(height: 4),
                      Text(title,
                          style: const TextStyle(
                              fontSize: 12, fontWeight: FontWeight.w900))
                    ])),
                Icon(Icons.arrow_forward,
                    size: 17, color: accent.withValues(alpha: .8))
              ])));

  Widget _spotlightRow() => LayoutBuilder(
      builder: (_, c) => c.maxWidth < 620
          ? Column(children: [
              _spotlight(),
              const SizedBox(height: 10),
              Row(children: [
                Expanded(
                    child: _quick(Icons.bolt_outlined, 'Champions\nCup',
                        'QUARTER-FINALS')),
                const SizedBox(width: 10),
                Expanded(
                    child: _quick(Icons.groups_outlined, 'Squad\nmanagement',
                        '11 STARTERS'))
              ])
            ])
          : Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Expanded(flex: 2, child: _spotlight()),
              const SizedBox(width: 10),
              Expanded(
                  child: _quick(
                      Icons.bolt_outlined, 'Champions\nCup', 'QUARTER-FINALS')),
              const SizedBox(width: 10),
              Expanded(
                  child: _quick(Icons.groups_outlined, 'Squad\nmanagement',
                      '11 STARTERS'))
            ]));
  Widget _spotlight() {
    final p = squad[selected];
    final stats = Row(children: [
      _stat(p.pace, 'PAC'),
      _stat(p.shooting, 'SHO'),
      _stat(p.passing, 'PAS')
    ]);
    final info = Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(p.name,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
      Text('${p.position} · CITY',
          style: const TextStyle(color: Color(0xFF75927E), fontSize: 10)),
      const SizedBox(height: 8),
      stats
    ]));
    return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(19),
            color: const Color(0xC90D2218),
            border: Border.all(color: const Color(0x293F7753))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('PLAYER SPOTLIGHT',
                    style: TextStyle(
                        color: Color(0xFFA3BCAB),
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.6)),
                Icon(Icons.auto_awesome, size: 16, color: Color(0xFF37DDF4))
              ]),
          const SizedBox(height: 12),
          Row(children: [
            Container(
                width: 74,
                height: 80,
                decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(15),
                    gradient: const LinearGradient(
                        colors: [Color(0xFF224C35), Color(0xFF11281E)])),
                child: Center(
                    child: Text(p.position,
                        style: const TextStyle(
                            color: Color(0xFF37DDF4),
                            fontWeight: FontWeight.w900,
                            fontSize: 22)))),
            const SizedBox(width: 12),
            info,
            const SizedBox(width: 8),
            Column(children: [
              Text('${p.rating}',
                  style: const TextStyle(
                      color: Color(0xFF37DDF4),
                      fontSize: 29,
                      fontWeight: FontWeight.w900)),
              const Text('OVR',
                  style: TextStyle(
                      color: Color(0xFF75927E),
                      fontSize: 8,
                      letterSpacing: 1.4))
            ])
          ])
        ]));
  }

  Widget _stat(int value, String label) => Padding(
      padding: const EdgeInsets.only(right: 10),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('$value',
            style: const TextStyle(
                color: Color(0xFFD8F4C2),
                fontWeight: FontWeight.w900,
                fontSize: 13)),
        Text(label,
            style: const TextStyle(color: Color(0xFF74917B), fontSize: 7))
      ]));
  Widget _quick(IconData icon, String title, String meta) => InkWell(
      onTap: () => toast('$title selected'),
      borderRadius: BorderRadius.circular(19),
      child: Container(
          height: 148,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(19),
              color: const Color(0xC90D2218),
              border: Border.all(color: const Color(0x293F7753))),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                    color: const Color(0x1A37DDF4),
                    borderRadius: BorderRadius.circular(11)),
                child: Icon(icon, size: 18, color: const Color(0xFF67E8F9))),
            const Spacer(),
            Text(title,
                style: const TextStyle(
                    fontSize: 15, height: 1.02, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(
                  child: Text(meta,
                      style: const TextStyle(
                          color: Color(0xFF789B7C),
                          fontSize: 8,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1))),
              const Icon(Icons.arrow_forward,
                  size: 14, color: Color(0xFF789B7C))
            ])
          ])));

  Widget _bottomNav() => Container(
      padding: const EdgeInsets.fromLTRB(18, 8, 18, 9),
      decoration: const BoxDecoration(
          color: Color(0xF2060B15),
          border: Border(top: BorderSide(color: Color(0x334ADDF4)))),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
        _navItem(Icons.home_rounded, 'HOME', 0),
        _navItem(Icons.sports_soccer_rounded, 'PLAY', 1),
        _navItem(Icons.shield_outlined, 'SQUAD', 2),
        _navItem(Icons.storefront_outlined, 'STORE', 3)
      ]));
  Widget _navItem(IconData icon, String label, int index) => InkWell(
      onTap: () {
        setState(() => nav = index);
        if (index == 0) {
          openPage('home');
        } else if (index == 1) {
          openPage('kickoff');
        } else if (index == 2) {
          openPage('squad');
        } else {
          openPage('career');
        }
      },
      child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon,
                size: 21,
                color: nav == index
                    ? const Color(0xFF37DDF4)
                    : const Color(0xFF698272)),
            const SizedBox(height: 3),
            Text(label,
                style: TextStyle(
                    color: nav == index
                        ? const Color(0xFF37DDF4)
                        : const Color(0xFF698272),
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1))
          ])));
}

class StadiumGlowPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final glow = Paint()
      ..shader = const RadialGradient(
        center: Alignment(-.68, -.78),
        radius: 1.15,
        colors: [Color(0xAA14C5EE), Color(0x33104B8C), Color(0x00101838)],
        stops: [0, .38, 1],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, glow);

    final light = Paint()..color = const Color(0x665DEBFF);
    for (var i = 0; i < 5; i++) {
      final x = size.width * (.08 + i * .21);
      canvas.drawCircle(Offset(x, size.height * .15), 2.2, light);
      final beam = Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [const Color(0x222FE4FF), Colors.transparent],
        ).createShader(Rect.fromLTWH(x - 28, size.height * .16, 56, size.height * .48));
      canvas.drawRect(Rect.fromLTWH(x - 28, size.height * .16, 56, size.height * .48), beam);
    }

    final pitch = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0x0005B9A9), Color(0x5530D8D0), Color(0x00102A46)],
        stops: [0, .78, 1],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset(0, size.height * .57) & Size(size.width, size.height * .43), pitch);

    final line = Paint()
      ..color = const Color(0x445DEBFF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    canvas.drawLine(Offset(0, size.height * .79), Offset(size.width, size.height * .79), line);
    canvas.drawCircle(Offset(size.width * .73, size.height * .79), size.width * .13, line);
    canvas.drawRect(Rect.fromLTWH(size.width * .53, size.height * .65, size.width * .4, size.height * .27), line);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class PlayerCard extends StatelessWidget {
  final Player player;
  final bool selected;
  final bool compact;
  final VoidCallback onTap;
  const PlayerCard(
      {super.key,
      required this.player,
      required this.selected,
      this.compact = false,
      required this.onTap});
  @override
  Widget build(BuildContext context) => GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          width: compact ? 48 : 60,
          height: compact ? 70 : 84,
          transform: Matrix4.translationValues(0, selected ? -7 : 0, 0)
            ..scaleByDouble(
                selected ? 1.08 : 1.0, selected ? 1.08 : 1.0, 1.0, 1.0),
          decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(11),
              gradient: const LinearGradient(colors: [
                Color(0xFFFFF1A7),
                Color(0xFFDCAE51),
                Color(0xFF8E5D25)
              ], begin: Alignment.topLeft, end: Alignment.bottomRight),
              border: Border.all(
                  color: selected
                      ? const Color(0xFF37DDF4)
                      : const Color(0xCCFFF0A4),
                  width: selected ? 2 : 1),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withValues(alpha: .4),
                    blurRadius: selected ? 13 : 7,
                    offset: const Offset(0, 6))
              ]),
          child: Padding(
              padding: const EdgeInsets.all(4),
              child: Column(children: [
                Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${player.rating}',
                          style: const TextStyle(
                              color: Color(0xFF4B3216),
                              fontSize: 12,
                              fontWeight: FontWeight.w900)),
                      Text(player.position,
                          style: const TextStyle(
                              color: Color(0xFF4B3216),
                              fontSize: 6,
                              fontWeight: FontWeight.w900))
                    ]),
                Expanded(
                    child: Center(
                        child: Icon(
                            player.position == 'GK'
                                ? Icons.sports_handball
                                : Icons.person,
                            color: const Color(0xFF283C27),
                            size: 31))),
                Text(player.shortName,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: Color(0xFF4B3216),
                        fontSize: 7,
                        fontWeight: FontWeight.w900)),
                Text('${player.pace} PAC · ${player.passing} PAS',
                    style: const TextStyle(
                        color: Color(0x994B3216),
                        fontSize: 5,
                        fontWeight: FontWeight.w800))
              ]))));
}

class PitchPainter extends CustomPainter {
  const PitchPainter();
  @override
  void paint(Canvas canvas, Size size) {
    final bg = Paint()
      ..shader = const LinearGradient(
              colors: [Color(0xFF0A3F22), Color(0xFF0E532A), Color(0xFF0A3F22)],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight)
          .createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, bg);
    final stripe = Paint()..color = const Color(0x1EAAE889);
    for (var i = 0; i < 8; i++) {
      canvas.drawRect(
          Rect.fromLTWH(size.width * i / 8, 0, size.width / 16, size.height),
          stripe);
    }
    final line = Paint()
      ..color = const Color(0x7ADFFFD9)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    canvas.drawLine(
        Offset(0, size.height / 2), Offset(size.width, size.height / 2), line);
    canvas.drawCircle(Offset(size.width / 2, size.height / 2), 44, line);
    canvas.drawCircle(Offset(size.width / 2, size.height / 2), 2.5,
        Paint()..color = const Color(0xB8DFFFD9));
    final boxWidth = size.width * .38;
    canvas.drawRect(
        Rect.fromLTWH(
            (size.width - boxWidth) / 2, 0, boxWidth, size.height * .18),
        line);
    canvas.drawRect(
        Rect.fromLTWH((size.width - boxWidth) / 2, size.height * .82, boxWidth,
            size.height * .18),
        line);
    final glow = Paint()
      ..shader =
          RadialGradient(colors: [const Color(0x2A37DDF4), Colors.transparent])
              .createShader(Rect.fromCircle(
                  center: Offset(size.width / 2, size.height / 2),
                  radius: 100));
    canvas.drawCircle(Offset(size.width / 2, size.height / 2), 100, glow);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class GameModePage extends StatefulWidget {
  final String mode;
  final VoidCallback onBack;
  final void Function(String) onToast;
  const GameModePage(
      {super.key,
      required this.mode,
      required this.onBack,
      required this.onToast});
  @override
  State<GameModePage> createState() => _GameModePageState();
}

class _GameModePageState extends State<GameModePage> {
  int scoreHome = 0;
  int scoreAway = 0;
  bool live = false;

  String get title => switch (widget.mode) {
        'kickoff' => 'KICK-OFF',
        'career' => 'CAREER MODE',
        'tournament' => 'CHAMPIONS CUP',
        'penalties' => 'PENALTY DUEL',
        'practice' => 'PRACTICE ARENA',
        'squad' => 'SQUAD MANAGEMENT',
        _ => 'MATCHDAY'
      };
  String get subtitle => switch (widget.mode) {
        'kickoff' => 'Choose your opponent and take control.',
        'career' => 'Build a dynasty across a full season.',
        'tournament' => 'Your road to the Champions Cup final.',
        'penalties' => 'Five shots. One winner.',
        'practice' => 'Sharpen your passing and shooting.',
        'squad' => 'Tune your formation and starting XI.',
        _ => 'Your next challenge awaits.'
      };

  @override
  Widget build(BuildContext context) =>
      ListView(padding: const EdgeInsets.fromLTRB(16, 20, 16, 30), children: [
        Row(children: [
          IconButton(
              onPressed: widget.onBack,
              icon: const Icon(Icons.arrow_back_rounded,
                  color: Color(0xFF37DDF4))),
          const SizedBox(width: 4),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title,
                style: const TextStyle(
                    color: Color(0xFF37DDF4),
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2)),
            const SizedBox(height: 4),
            Text(subtitle,
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.w900))
          ])
        ]),
        const SizedBox(height: 18),
        if (widget.mode == 'kickoff') _kickoff(),
        if (widget.mode == 'career') _career(),
        if (widget.mode == 'tournament') _tournament(),
        if (widget.mode == 'penalties') _penalties(),
        if (widget.mode == 'practice') _practice(),
        if (widget.mode == 'squad') _squad(),
      ]);

  Widget _panel(Widget child) => Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          color: const Color(0xC90D2218),
          border: Border.all(color: const Color(0x333F7753))),
      child: child);
  Widget _action(String label, VoidCallback onTap,
          {IconData icon = Icons.arrow_forward}) =>
      FilledButton.icon(
          onPressed: onTap,
          icon: Icon(icon, size: 17),
          label: Text(label,
              style: const TextStyle(
                  fontWeight: FontWeight.w900, letterSpacing: 1)),
          style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF37DDF4),
              foregroundColor: const Color(0xFF070B13),
              padding:
                  const EdgeInsets.symmetric(horizontal: 17, vertical: 14)));
  Widget _team(String name, int rating, Color color) => Expanded(
      child: Container(
          padding: const EdgeInsets.all(15),
          decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(17),
              color: color.withValues(alpha: .18),
              border: Border.all(color: color.withValues(alpha: .4))),
          child: Column(children: [
            Icon(Icons.shield_rounded, color: color, size: 35),
            const SizedBox(height: 8),
            Text(name, style: const TextStyle(fontWeight: FontWeight.w900)),
            Text('OVR $rating',
                style: TextStyle(
                    color: color, fontSize: 10, fontWeight: FontWeight.w900))
          ])));
  Widget _kickoff() => _panel(Column(children: [
        Row(children: [
          _team('CITY', 84, const Color(0xFF9ED4FF)),
          const Padding(
              padding: EdgeInsets.symmetric(horizontal: 13),
              child: Text('VS',
                  style: TextStyle(
                      color: Color(0xFF79927E), fontWeight: FontWeight.w900))),
          _team('ARSENAL', 86, const Color(0xFFFF8E8E))
        ]),
        const SizedBox(height: 22),
        _action('START MATCH', () {
          setState(() {
            live = true;
          });
          widget.onToast('Match started — good luck!');
        }, icon: Icons.play_arrow_rounded),
        if (live)
          const Padding(
              padding: EdgeInsets.only(top: 16),
              child: Text('LIVE MATCH  •  00:00',
                  style: TextStyle(
                      color: Color(0xFF37DDF4),
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1)))
      ]));
  Widget _career() => Column(children: [
        _panel(Row(children: [
          const Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text('SEASON 01 / MATCHWEEK 07',
                    style: TextStyle(
                        color: Color(0xFFA3BCAB),
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.4)),
                SizedBox(height: 8),
                Text('Title race is heating up.',
                    style:
                        TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                SizedBox(height: 5),
                Text('Manage transfers, rotate the squad and chase the trophy.',
                    style: TextStyle(color: Color(0xFF7C9583), fontSize: 11))
              ])),
          const Icon(Icons.trending_up, color: Color(0xFF37DDF4), size: 38)
        ])),
        const SizedBox(height: 12),
        _fixture('NEXT FIXTURE', 'CITY', 'LIVERPOOL', 'SAT 15:00'),
        const SizedBox(height: 12),
        _table(),
        const SizedBox(height: 16),
        _action('PLAY FIXTURE', () => widget.onToast('Career fixture loaded'))
      ]);
  Widget _fixture(String label, String home, String away, String time) =>
      _panel(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label,
            style: const TextStyle(
                color: Color(0xFFA3BCAB),
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.4)),
        const SizedBox(height: 12),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(home,
              style:
                  const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
          Column(children: [
            const Text('VS',
                style: TextStyle(
                    color: Color(0xFF37DDF4), fontWeight: FontWeight.w900)),
            Text(time,
                style: const TextStyle(color: Color(0xFF7C9583), fontSize: 9))
          ]),
          Text(away,
              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18))
        ])
      ]));
  Widget _table() =>
      _panel(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('LEAGUE TABLE',
            style: TextStyle(
                color: Color(0xFFA3BCAB),
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.4)),
        const SizedBox(height: 10),
        ...[
          '1  CITY                         18',
          '2  LIVERPOOL                 17',
          '3  ARSENAL                   15',
          '4  UNITED                     13'
        ].map((x) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 5),
            child: Text(x,
                style: TextStyle(
                    color: x.startsWith('1')
                        ? const Color(0xFF37DDF4)
                        : const Color(0xFFD3E5D4),
                    fontSize: 12,
                    fontWeight: FontWeight.w700))))
      ]));
  Widget _tournament() =>
      _panel(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('QUARTER-FINALS',
            style: TextStyle(
                color: Color(0xFFA3BCAB),
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.4)),
        const SizedBox(height: 14),
        ...[
          'CITY        2  —  1    INTER',
          'BARCELONA  3  —  2    PSG',
          'REAL        1  —  0    BAYERN'
        ].map((x) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Text(x,
                style: const TextStyle(
                    fontWeight: FontWeight.w800, fontSize: 13)))),
        const SizedBox(height: 12),
        _action(
            'PLAY SEMI-FINAL', () => widget.onToast('Tournament match loaded'))
      ]));
  Widget _penalties() => _panel(Column(children: [
        const Text('CITY  0  —  0  ARSENAL',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
        const SizedBox(height: 8),
        Text('SHOT ${scoreHome + scoreAway + 1} OF 5',
            style: const TextStyle(
                color: Color(0xFFA3BCAB),
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5)),
        const SizedBox(height: 22),
        Container(
            height: 150,
            decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                color: const Color(0xFF0E522B)),
            child: const Center(
                child: Icon(Icons.sports_soccer,
                    color: Color(0xFFD8F4C2), size: 44))),
        const SizedBox(height: 18),
        Wrap(
            spacing: 8,
            children: ['LEFT', 'CENTER', 'RIGHT']
                .map((direction) => OutlinedButton(
                    onPressed: () {
                      setState(() {
                        scoreHome++;
                      });
                      widget.onToast('Saved to match log: $direction finish');
                    },
                    child: Text(direction)))
                .toList())
      ]));
  Widget _practice() =>
      _panel(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('PRECISION DRILLS',
            style: TextStyle(
                color: Color(0xFFA3BCAB),
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.4)),
        const SizedBox(height: 8),
        const Text('Complete three targets to earn training points.',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
        const SizedBox(height: 18),
        ...[
          'Short passing  •  8 / 10',
          'Top corner  •  4 / 5',
          'Through balls  •  6 / 8'
        ].map((x) => ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.check_circle_outline,
                color: Color(0xFF37DDF4)),
            title: Text(x),
            trailing:
                const Icon(Icons.chevron_right, color: Color(0xFF7C9583)))),
        _action('START DRILL', () => widget.onToast('Practice arena ready'),
            icon: Icons.sports_soccer)
      ]));
  Widget _squad() =>
      _panel(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('FORMATION',
            style: TextStyle(
                color: Color(0xFFA3BCAB),
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.4)),
        const SizedBox(height: 8),
        const Text('4-3-3 ATTACKING',
            style: TextStyle(
                color: Color(0xFF37DDF4),
                fontSize: 22,
                fontWeight: FontWeight.w900)),
        const SizedBox(height: 16),
        ...squad.take(5).map((p) => ListTile(
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(
                backgroundColor: const Color(0xFF204731),
                child: Text('${p.rating}',
                    style: const TextStyle(
                        color: Color(0xFF37DDF4),
                        fontSize: 11,
                        fontWeight: FontWeight.w900))),
            title: Text(p.name,
                style: const TextStyle(fontWeight: FontWeight.w800)),
            subtitle: Text(p.position,
                style: const TextStyle(color: Color(0xFF7C9583))),
            trailing: const Icon(Icons.drag_handle, color: Color(0xFF7C9583)))),
        _action('SAVE LINEUP', () => widget.onToast('Lineup saved'),
            icon: Icons.check)
      ]));
}
