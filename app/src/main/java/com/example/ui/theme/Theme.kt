package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

import androidx.compose.material3.Shapes
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.unit.dp

data class AppThemeColors(
    val isDark: Boolean,
    val background: Color,
    val surface: Color,
    val surfaceVariant: Color,
    val border: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textMuted: Color,
    val primary: Color,
    val primaryContainer: Color,
    val onPrimaryContainer: Color,
    val gain: Color,
    val gainContainer: Color,
    val onGainContainer: Color,
    val loss: Color,
    val lossContainer: Color,
    val onLossContainer: Color,
    val warning: Color,
    val warningContainer: Color,
    val onWarningContainer: Color,
    val inputBackground: Color,
    val inputBorder: Color,
    val inputText: Color,
    val inputPlaceholder: Color,
    val cardHighlight: Color
)

// Same signature/field-set as before — only the underlying values were tuned for
// a softer, higher-contrast, more "modern fintech app" feel.
fun getAppColors(primaryHex: Long, isDark: Boolean): AppThemeColors {
    val primaryColor = Color(primaryHex)
    return if (isDark) {
        val bg = Color(0xFF0A0B10)
        val surfColor = Color(0xFF15171F)
        AppThemeColors(
            isDark = true,
            background = bg,
            surface = surfColor,
            surfaceVariant = Color(0xFF1C1F2B),
            border = Color(0xFF262A38),
            textPrimary = Color(0xFFF5F6FA),
            textSecondary = Color(0xFFA3AABF),
            textMuted = Color(0xFF6B7286),
            primary = primaryColor,
            primaryContainer = primaryColor.copy(alpha = 0.22f),
            onPrimaryContainer = Color(0xFFD6E7FF),
            gain = Color(0xFF22C55E),
            gainContainer = Color(0xFF0F3524),
            onGainContainer = Color(0xFFB4F5D0),
            loss = Color(0xFFF75A6B),
            lossContainer = Color(0xFF421420),
            onLossContainer = Color(0xFFFFD2DA),
            warning = Color(0xFFF5A524),
            warningContainer = Color(0xFF3D2807),
            onWarningContainer = Color(0xFFFFE1A8),
            inputBackground = Color(0xFF191C27),
            inputBorder = Color(0xFF31364A),
            inputText = Color(0xFFF5F6FA),
            inputPlaceholder = Color(0xFF747C93),
            cardHighlight = Color(0xFF232739)
        )
    } else {
        val bg = Color(0xFFF7F8FB)
        AppThemeColors(
            isDark = false,
            background = bg,
            surface = Color(0xFFFFFFFF),
            surfaceVariant = Color(0xFFEEF1F6),
            border = Color(0xFFE2E6EF),
            textPrimary = Color(0xFF11151F),
            textSecondary = Color(0xFF4C5567),
            textMuted = Color(0xFF9AA2B4),
            primary = primaryColor,
            primaryContainer = primaryColor.copy(alpha = 0.12f),
            onPrimaryContainer = primaryColor,
            gain = Color(0xFF0C8F5C),
            gainContainer = Color(0xFFDCF7E7),
            onGainContainer = Color(0xFF00431F),
            loss = Color(0xFFDC2647),
            lossContainer = Color(0xFFFFE2E7),
            onLossContainer = Color(0xFF5D0016),
            warning = Color(0xFFC4740A),
            warningContainer = Color(0xFFFEF0D6),
            onWarningContainer = Color(0xFF432B02),
            inputBackground = Color(0xFFF4F5F9),
            inputBorder = Color(0xFFD9DEE9),
            inputText = Color(0xFF11151F),
            inputPlaceholder = Color(0xFF9AA2B4),
            cardHighlight = Color(0xFFEFF2F8)
        )
    }
}

val DarkAppColors = getAppColors(0xFF005FB1, true)
val LightAppColors = getAppColors(0xFF005FB1, false)

val LocalAppThemeColors = staticCompositionLocalOf { LightAppColors }

object AppTheme {
    val colors: AppThemeColors
        @Composable
        get() = LocalAppThemeColors.current

    @Composable
    fun getDepthColor(depth: Int, isSelected: Boolean): Color {
        if (isSelected) return colors.primary

        val isDark = colors.isDark
        return when (depth) {
            0 -> colors.textPrimary
            1 -> if (isDark) Color(0xFF4ADE80) else Color(0xFF16A34A)
            2 -> if (isDark) Color(0xFFFBBF24) else Color(0xFFD97706)
            3 -> if (isDark) Color(0xFF60A5FA) else Color(0xFF2563EB)
            4 -> if (isDark) Color(0xFFF472B6) else Color(0xFFDB2777)
            5 -> if (isDark) Color(0xFFC084FC) else Color(0xFF9333EA)
            else -> if (isDark) Color(0xFF9CA3AF) else Color(0xFF4B5563)
        }
    }

    val typography: Typography
        @Composable
        get() = MaterialTheme.typography
}

// Softer, more contemporary corner radii across every Card/Surface/Dialog that
// references MaterialTheme.shapes instead of a hardcoded RoundedCornerShape.
val ModernShapes = Shapes(
    extraSmall = RoundedCornerShape(14.dp),
    small = RoundedCornerShape(18.dp),
    medium = RoundedCornerShape(22.dp),
    large = RoundedCornerShape(28.dp),
    extraLarge = RoundedCornerShape(36.dp)
)

private val DarkColorScheme =
  darkColorScheme(
    primary = DarkAppColors.primary,
    onPrimary = Color.White,
    primaryContainer = DarkAppColors.primaryContainer,
    onPrimaryContainer = DarkAppColors.onPrimaryContainer,
    secondary = HighDensitySecondary,
    onSecondary = Color.White,
    secondaryContainer = HighDensitySecondaryContainer,
    onSecondaryContainer = HighDensityOnSecondaryContainer,
    tertiary = DarkAppColors.gain,
    background = DarkAppColors.background,
    surface = DarkAppColors.surface,
    surfaceVariant = DarkAppColors.surfaceVariant,
    outline = DarkAppColors.border,
    onBackground = DarkAppColors.textPrimary,
    onSurface = DarkAppColors.textPrimary
  )

private val LightColorScheme =
  lightColorScheme(
    primary = LightAppColors.primary,
    onPrimary = Color.White,
    primaryContainer = LightAppColors.primaryContainer,
    onPrimaryContainer = LightAppColors.onPrimaryContainer,
    secondary = HighDensitySecondary,
    onSecondary = Color.White,
    secondaryContainer = HighDensitySecondaryContainer,
    onSecondaryContainer = HighDensityOnSecondaryContainer,
    tertiary = LightAppColors.gain,
    background = LightAppColors.background,
    surface = LightAppColors.surface,
    surfaceVariant = LightAppColors.surfaceVariant,
    outline = LightAppColors.border,
    onBackground = LightAppColors.textPrimary,
    onSurface = LightAppColors.textPrimary,
  )

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  dynamicColor: Boolean = false,
  primaryColorHex: Long = 0xFF005FB1,
  fontScale: Float = 1.0f,
  content: @Composable () -> Unit,
) {
  val context = LocalContext.current
  val appColors = remember(primaryColorHex, darkTheme) { getAppColors(primaryColorHex, darkTheme) }

  val colorScheme = remember(primaryColorHex, darkTheme, dynamicColor) {
    if (dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
    } else if (darkTheme) {
      darkColorScheme(
        primary = appColors.primary,
        onPrimary = Color.White,
        primaryContainer = appColors.primaryContainer,
        onPrimaryContainer = appColors.onPrimaryContainer,
        secondary = HighDensitySecondary,
        onSecondary = Color.White,
        secondaryContainer = HighDensitySecondaryContainer,
        onSecondaryContainer = HighDensityOnSecondaryContainer,
        tertiary = appColors.gain,
        background = appColors.background,
        surface = appColors.surface,
        surfaceVariant = appColors.surfaceVariant,
        outline = appColors.border,
        onBackground = appColors.textPrimary,
        onSurface = appColors.textPrimary
      )
    } else {
      lightColorScheme(
        primary = appColors.primary,
        onPrimary = Color.White,
        primaryContainer = appColors.primaryContainer,
        onPrimaryContainer = appColors.onPrimaryContainer,
        secondary = HighDensitySecondary,
        onSecondary = Color.White,
        secondaryContainer = HighDensitySecondaryContainer,
        onSecondaryContainer = HighDensityOnSecondaryContainer,
        tertiary = appColors.gain,
        background = appColors.background,
        surface = appColors.surface,
        surfaceVariant = appColors.surfaceVariant,
        outline = appColors.border,
        onBackground = appColors.textPrimary,
        onSurface = appColors.textPrimary
      )
    }
  }

  val currentDensity = androidx.compose.ui.platform.LocalDensity.current
  val customDensity = remember(currentDensity, fontScale) {
      androidx.compose.ui.unit.Density(currentDensity.density * fontScale, currentDensity.fontScale * fontScale)
  }

  CompositionLocalProvider(
      LocalAppThemeColors provides appColors,
      androidx.compose.ui.platform.LocalDensity provides customDensity
  ) {
    MaterialTheme(colorScheme = colorScheme, typography = Typography, shapes = ModernShapes, content = content)
  }
}
