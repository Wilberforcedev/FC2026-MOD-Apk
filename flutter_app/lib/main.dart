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
            .copyWith(scaffoldBackgroundColor: const Color(0xFF07110F)),
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
                      constraints: const BoxConstraints(maxWidth: 1120),
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _hero(),
                            const SizedBox(height: 18),
                            _squadPanel(width),
                            const SizedBox(height: 14),
                            _featureRow(),
                            const SizedBox(height: 14),
                            _spotlightRow(),
                          ]),
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

  Widget _topBar() => Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        decoration: const BoxDecoration(
            color: Color(0xE607100E),
            border: Border(bottom: BorderSide(color: Color(0x263A7650)))),
        child: Row(children: [
          Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                  color: const Color(0xFF102B1E),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0x4D9DDA72))),
              child:
                  const Icon(Icons.shield_rounded, color: Color(0xFFB9ED4E))),
          const SizedBox(width: 10),
          const Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text('MANAGER ID 42',
                    style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 11,
                        letterSpacing: 1.2)),
                Text('FC Online  •  Cloud Synced',
                    style: TextStyle(color: Color(0xFF7C9583), fontSize: 10))
              ])),
          _coinPill(),
          const SizedBox(width: 8),
          _roundIcon(Icons.mail_outline, badge: '3'),
          const SizedBox(width: 7),
          _roundIcon(Icons.notifications_none),
          const SizedBox(width: 7),
          _roundIcon(Icons.settings_outlined),
        ]),
      );

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
  Widget _roundIcon(IconData icon, {String? badge}) =>
      Stack(clipBehavior: Clip.none, children: [
        Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
                color: const Color(0xFF101D17),
                borderRadius: BorderRadius.circular(11),
                border: Border.all(color: const Color(0x443C8056))),
            child: Icon(icon, size: 17, color: const Color(0xFFA8B9A7))),
        if (badge != null)
          Positioned(
              right: -3,
              top: -4,
              child: CircleAvatar(
                  radius: 8,
                  backgroundColor: const Color(0xFFB9ED4E),
                  child: Text(badge,
                      style: const TextStyle(
                          color: Color(0xFF07110F),
                          fontSize: 9,
                          fontWeight: FontWeight.w900))))
      ]);
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
                          color: Color(0xFFB9ED4E),
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
                                color: Color(0xFFB9ED4E),
                                fontSize: 11,
                                fontWeight: FontWeight.w900)),
                        Icon(Icons.chevron_right,
                            size: 15, color: Color(0xFFB9ED4E))
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
                            offset: const Offset(-30, -42),
                            child: PlayerCard(
                                player: squad[i],
                                selected: selected == i,
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
                            color: Color(0xFFB9ED4E),
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
                              color: Color(0xFFB9ED4E))))),
              const SizedBox(width: 14),
              IconButton(
                  onPressed: () => toast('Squad editor opened'),
                  icon: const Icon(Icons.edit_outlined,
                      color: Color(0xFFB9ED4E), size: 18))
            ])),
      ]));

  Widget _featureRow() => Row(children: [
        Expanded(
            child: _feature(
                Icons.play_arrow_rounded,
                'READY TO PLAY',
                'Kick-off match',
                const Color(0xFFB9ED4E),
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
                        Icon(icon, color: const Color(0xFF07110F), size: 17)),
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
                Icon(Icons.auto_awesome, size: 16, color: Color(0xFFB9ED4E))
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
                            color: Color(0xFFB9ED4E),
                            fontWeight: FontWeight.w900,
                            fontSize: 22)))),
            const SizedBox(width: 12),
            info,
            const SizedBox(width: 8),
            Column(children: [
              Text('${p.rating}',
                  style: const TextStyle(
                      color: Color(0xFFB9ED4E),
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
                    color: const Color(0x1AB9ED4E),
                    borderRadius: BorderRadius.circular(11)),
                child: Icon(icon, size: 18, color: const Color(0xFFC8F267))),
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
          color: Color(0xF209100E),
          border: Border(top: BorderSide(color: Color(0x263A7650)))),
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
                    ? const Color(0xFFB9ED4E)
                    : const Color(0xFF698272)),
            const SizedBox(height: 3),
            Text(label,
                style: TextStyle(
                    color: nav == index
                        ? const Color(0xFFB9ED4E)
                        : const Color(0xFF698272),
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1))
          ])));
}

class PlayerCard extends StatelessWidget {
  final Player player;
  final bool selected;
  final VoidCallback onTap;
  const PlayerCard(
      {super.key,
      required this.player,
      required this.selected,
      required this.onTap});
  @override
  Widget build(BuildContext context) => GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          width: 60,
          height: 84,
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
                      ? const Color(0xFFB9ED4E)
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
          RadialGradient(colors: [const Color(0x2AB9ED4E), Colors.transparent])
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
                  color: Color(0xFFB9ED4E))),
          const SizedBox(width: 4),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title,
                style: const TextStyle(
                    color: Color(0xFFB9ED4E),
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
              backgroundColor: const Color(0xFFB9ED4E),
              foregroundColor: const Color(0xFF07110F),
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
                      color: Color(0xFFB9ED4E),
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
          const Icon(Icons.trending_up, color: Color(0xFFB9ED4E), size: 38)
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
                    color: Color(0xFFB9ED4E), fontWeight: FontWeight.w900)),
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
                        ? const Color(0xFFB9ED4E)
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
                color: Color(0xFFB9ED4E)),
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
                color: Color(0xFFB9ED4E),
                fontSize: 22,
                fontWeight: FontWeight.w900)),
        const SizedBox(height: 16),
        ...squad.take(5).map((p) => ListTile(
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(
                backgroundColor: const Color(0xFF204731),
                child: Text('${p.rating}',
                    style: const TextStyle(
                        color: Color(0xFFB9ED4E),
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
