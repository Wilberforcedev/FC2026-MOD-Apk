import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fc2026_squad/main.dart';

void main() {
  testWidgets('renders the FC 2026 game mode hub', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const FC2026App());

    expect(find.text('FC 2026'), findsOneWidget);
    expect(find.text('MATCHDAY 07'), findsOneWidget);
    expect(find.text('DREAM FC'), findsOneWidget);
    expect(find.text('CHOOSE YOUR MODE'), findsOneWidget);
    expect(find.text('CONTINUE CAREER'), findsOneWidget);
  });
}
