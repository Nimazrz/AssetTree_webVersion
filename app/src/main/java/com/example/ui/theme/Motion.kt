package com.example.ui.theme

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer

import androidx.compose.runtime.getValue
/**
 * Shared "press to shrink slightly" tactile feedback for tappable surfaces
 * (cards, pills, icon buttons). Purely visual — chain it onto an existing
 * Modifier before .clickable {...}; it never changes click behaviour.
 *
 *   Modifier.bounceClick().clickable { onClick() }
 */
@Composable
fun Modifier.bounceClick(
    interactionSource: MutableInteractionSource? = null,
    scaleDown: Float = 0.95f
): Modifier {
    val source = interactionSource ?: remember { MutableInteractionSource() }
    val isPressed by source.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed) scaleDown else 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium
        ),
        label = "bounceClickScale"
    )
    return this.graphicsLayer {
        scaleX = scale
        scaleY = scale
    }
}
