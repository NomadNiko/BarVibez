# CLAUDE.md - Important Patterns to Remember

## UI Layout Pattern for Tab Screens - NEVER FUCKING BREAK THIS AGAIN

**ALWAYS use this EXACT pattern for tab screens to prevent title clipping - COPY FROM COCKTAILS.TSX:**

```tsx
<SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
  <View style={{ paddingHorizontal: 12, flex: 1 }}>
    <Container>
    {/* Header */}
    <View className="pb-4">
      <Text className="mb-2 text-2xl font-bold text-foreground">Title Here</Text>
      <Text className="text-sm text-muted-foreground">
        Subtitle here
      </Text>
    </View>
    
    {/* Rest of content goes here */}
    
    </Container>
  </View>
</SafeAreaView>
```

**CRITICAL - THE ONLY PATTERN THAT WORKS:**
1. SafeAreaView with **className** (not style)
2. View with **paddingHorizontal: 12** and **flex: 1**
3. Container component
4. Header with **className="pb-4"**
5. Title with **className="mb-2 text-2xl font-bold text-foreground"**

**NEVER EVER DO:**
- Use style prop on SafeAreaView instead of className
- Use paddingHorizontal: 16 or 20 - MUST be 12
- Use ScrollView wrapping everything
- Use any other header pattern
- Try to be creative - COPY THE WORKING PATTERN EXACTLY

## Project Structure

This is a React Native Expo app with:
- NativeWind (Tailwind CSS for React Native)
- TypeScript
- MMKV for data storage
- Dark theme bartending app (Bar Vibez)

## Key Features
- Cocktail database with local images
- User venues (Speakeasy tab)
- Subscription tiers (Free/Premium)
- Favorites system synced with "My Speakeasy" venue

## CRITICAL EDITING RULE - NEVER FUCKING IGNORE THIS

**YOU DO NOT EDIT FILES WITHOUT READING THEM IN FULL FIRST**

- ALWAYS use Read tool to read the ENTIRE file before making any edits
- DO NOT use Grep or search to find strings without reading the full file first
- READ THE WHOLE FILE to understand context before making changes
- This prevents missing instances and breaking code
- NO EXCEPTIONS TO THIS RULE