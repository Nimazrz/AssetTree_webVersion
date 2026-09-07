package com.example.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit

/**
 * Renders a currency/number string that smoothly counts up or down whenever
 * [rawValue] changes, instead of snapping instantly. Falls back to plain text
 * immediately for privacy-masked strings (e.g. "••••••••") so masking
 * behaviour is fully preserved.
 *
 * [formatter] must format the interpolated value exactly like the rest of the
 * app (same digits, separators, currency suffix) — only the transition
 * between values is animated, never the formatting rules themselves.
 */
@Composable
fun AnimatedAmountText(
    rawValue: Double,
    displayText: String,
    formatter: (Double) -> String,
    color: Color,
    fontSize: TextUnit,
    fontWeight: FontWeight = FontWeight.Black,
    modifier: Modifier = Modifier
) {
    val isMasked = displayText.contains('•')

    val animatedValue by animateFloatAsState(
        targetValue = rawValue.toFloat(),
        animationSpec = tween(durationMillis = 450),
        label = "animatedAmount"
    )

    val textToShow = if (isMasked) displayText else formatter(animatedValue.toDouble())

    androidx.compose.material3.Text(
        text = textToShow,
        color = color,
        fontSize = fontSize,
        fontWeight = fontWeight,
        modifier = modifier
    )
}
