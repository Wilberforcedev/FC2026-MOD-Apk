import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fc2026_squad/main.dart';

void main() {
  testWidgets('renders the FC 2026 tactical hub', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(const FC2026App());
    expect(find.text('Build your\nultimate XI.'), findsOneWidget);
    expect(find.text('TACTICAL HUB'), findsOneWidget);
    expect(find.text('TEAM CHEMISTRY'), findsOneWidget);
  });
}
