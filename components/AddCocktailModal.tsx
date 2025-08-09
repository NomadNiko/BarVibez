import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { Container } from '~/components/Container';
import { useUserCocktails, useVenues } from '~/lib/contexts/UserContext';
import { CocktailIngredientInput } from '~/lib/types/user';
import { UserCocktail } from '~/lib/types/cocktail';

// Glass types available in the app
const GLASS_TYPES = [
  'Balloon Glass',
  'Beer Glass', 
  'Beer Mug',
  'Beer Pilsner',
  'Brandy Snifter',
  'Champagne Flute',
  'Cocktail Glass',
  'Coffee Mug',
  'Collins Glass',
  'Copper Mug',
  'Cordial Glass',
  'Coupe Glass',
  'Highball Glass',
  'Hurricane Glass',
  'Irish Coffee Cup',
  'Jar',
  'Julep Tin',
  'Margarita Glass',
  'Margarita/Coupette Glass',
  'Martini Glass',
  'Mason Jar',
  'Nick And Nora Glass',
  'Old-Fashioned Glass',
  'Parfait Glass',
  'Pint Glass',
  'Pitcher',
  'Pousse Cafe Glass',
  'Punch Bowl',
  'Shot Glass',
  'Whiskey Glass',
  'Whiskey Sour Glass',
  'White Wine Glass',
  'Wine Glass',
];

interface IngredientInput {
  name: string;
  measure: string;
}

interface AddCocktailModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editCocktail?: UserCocktail | null;
}

export function AddCocktailModal({ visible, onClose, onSuccess, editCocktail }: AddCocktailModalProps) {
  const { createUserCocktail, updateUserCocktail } = useUserCocktails();
  const { venues } = useVenues();
  
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<IngredientInput[]>([{ name: '', measure: '' }]);
  const [instructions, setInstructions] = useState('');
  const [selectedGlass, setSelectedGlass] = useState('Cocktail Glass');
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [showGlassPicker, setShowGlassPicker] = useState(false);
  // const [showVenuePicker, setShowVenuePicker] = useState(false); // Unused for now
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when editCocktail changes
  useEffect(() => {
    if (editCocktail) {
      setName(editCocktail.name);
      setIngredients(editCocktail.ingredients?.map(ing => ({ name: ing.name, measure: ing.measure || '' })) || [{ name: '', measure: '' }]);
      setInstructions(editCocktail.instructions);
      setSelectedGlass(editCocktail.glass);
      setSelectedVenues(editCocktail.venues?.filter(id => !venues.find(v => v.id === id)?.isDefault) || []);
    } else {
      setName('');
      setIngredients([{ name: '', measure: '' }]);
      setInstructions('');
      setSelectedGlass('Cocktail Glass');
      setSelectedVenues([]);
    }
  }, [editCocktail, venues]);

  // Get default venue (My Speakeasy)
  const defaultVenue = venues.find(v => v.isDefault);
  const nonDefaultVenues = venues.filter(v => !v.isDefault);

  const addIngredientField = () => {
    setIngredients([...ingredients, { name: '', measure: '' }]);
  };

  const removeIngredientField = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: keyof IngredientInput, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const toggleVenueSelection = (venueId: string) => {
    setSelectedVenues(prev => 
      prev.includes(venueId) 
        ? prev.filter(id => id !== venueId)
        : [...prev, venueId]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a cocktail name');
      return;
    }

    const validIngredients = ingredients.filter(ing => ing.name.trim());
    if (validIngredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }

    if (!instructions.trim()) {
      Alert.alert('Error', 'Please enter instructions');
      return;
    }

    if (instructions.length > 256) {
      Alert.alert('Error', 'Instructions must be 256 characters or less');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const cocktailIngredients: CocktailIngredientInput[] = validIngredients.map(ing => ({
        name: ing.name.trim(),
        measure: ing.measure.trim() || undefined
      }));

      if (editCocktail) {
        // Update existing cocktail
        await updateUserCocktail(editCocktail.id, {
          name: name.trim(),
          ingredients: cocktailIngredients,
          instructions: instructions.trim(),
          glass: selectedGlass,
          venueIds: selectedVenues
        });
      } else {
        // Create new cocktail
        await createUserCocktail(
          name.trim(),
          cocktailIngredients,
          instructions.trim(),
          selectedGlass,
          selectedVenues
        );
      }

      // Reset form
      setName('');
      setIngredients([{ name: '', measure: '' }]);
      setInstructions('');
      setSelectedGlass('Cocktail Glass');
      setSelectedVenues([]);
      setIsSubmitting(false);
      
      // Call success callback which will handle navigation
      onSuccess();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create cocktail');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#0f0f0f' }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 60}>
            
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#333333',
              backgroundColor: '#0f0f0f'
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 24, color: '#ffffff', marginBottom: 4 }}>
                  {editCocktail ? 'Edit Cocktail' : 'Add Cocktail'}
                </Text>
                <Text style={{ fontSize: 14, color: '#888888' }}>
                  {editCocktail ? 'Edit your cocktail recipe' : 'Create your own cocktail recipe'}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: 20,
                  width: 36,
                  height: 36,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: 16
                }}>
                <FontAwesome name="times" size={16} color="#ffffff" />
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: 20, flex: 1 }}>
              <Container>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Name Field */}
            <View style={{ marginBottom: 20, marginTop: 20 }}>
              <Text style={{ color: '#ffffff', fontSize: 18, marginBottom: 8 }}>
                Cocktail Name *
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#0f0f0f',
                  borderRadius: 12,
                  padding: 16,
                  color: '#ffffff',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#333333'
                }}
                placeholder="Enter cocktail name..."
                placeholderTextColor="#666666"
                value={name}
                onChangeText={setName}
                maxLength={100}
              />
            </View>

            {/* Ingredients Section */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#ffffff', fontSize: 18, marginBottom: 8 }}>
                Ingredients *
              </Text>

              {ingredients.map((ingredient, index) => (
                <View key={index} style={{ 
                  flexDirection: 'row', 
                  marginBottom: 12, 
                  backgroundColor: '#0f0f0f',
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#333333'
                }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ color: '#888888', fontSize: 12, marginBottom: 4 }}>Ingredient</Text>
                    <TextInput
                      style={{
                        color: '#ffffff',
                        fontSize: 16,
                        padding: 0
                      }}
                      placeholder="e.g., Vodka"
                      placeholderTextColor="#666666"
                      value={ingredient.name}
                      onChangeText={(text) => updateIngredient(index, 'name', text)}
                    />
                  </View>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ color: '#888888', fontSize: 12, marginBottom: 4 }}>Measure</Text>
                    <TextInput
                      style={{
                        color: '#ffffff',
                        fontSize: 16,
                        padding: 0
                      }}
                      placeholder="e.g., 2 oz"
                      placeholderTextColor="#666666"
                      value={ingredient.measure}
                      onChangeText={(text) => updateIngredient(index, 'measure', text)}
                    />
                  </View>
                  {ingredients.length > 1 && (
                    <Pressable
                      onPress={() => removeIngredientField(index)}
                      style={{ 
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#FF3B30'
                      }}>
                      <FontAwesome name="minus" size={12} color="#ffffff" />
                    </Pressable>
                  )}
                </View>
              ))}

              {/* Add Ingredient Button - moved to bottom */}
              <View style={{ alignItems: 'flex-end' }}>
                <Pressable
                  onPress={addIngredientField}
                  style={{
                    backgroundColor: '#007AFF',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                  <FontAwesome name="plus" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#ffffff', fontSize: 14 }}>Add Ingredient</Text>
                </Pressable>
              </View>
            </View>

            {/* Instructions Field */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: '#ffffff', fontSize: 18 }}>
                  Instructions *
                </Text>
                <Text style={{ color: '#666666', fontSize: 12 }}>
                  {instructions.length}/256
                </Text>
              </View>
              <TextInput
                style={{
                  backgroundColor: '#0f0f0f',
                  borderRadius: 12,
                  padding: 16,
                  color: '#ffffff',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#333333',
                  height: 120,
                  textAlignVertical: 'top'
                }}
                placeholder="Enter preparation instructions..."
                placeholderTextColor="#666666"
                value={instructions}
                onChangeText={setInstructions}
                maxLength={256}
                multiline
              />
            </View>

            {/* Glass Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#ffffff', fontSize: 18, marginBottom: 8 }}>
                Glassware *
              </Text>
              <Pressable
                onPress={() => setShowGlassPicker(!showGlassPicker)}
                style={{
                  backgroundColor: '#0f0f0f',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#333333'
                }}>
                <Text style={{ color: '#ffffff', fontSize: 16 }}>{selectedGlass}</Text>
                <FontAwesome name={showGlassPicker ? "chevron-up" : "chevron-down"} size={16} color="#666666" />
              </Pressable>
              
              {showGlassPicker && (
                <View style={{
                  backgroundColor: '#0f0f0f',
                  borderRadius: 12,
                  marginTop: 8,
                  maxHeight: 200,
                  borderWidth: 1,
                  borderColor: '#333333'
                }}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {GLASS_TYPES.map((glass) => (
                      <Pressable
                        key={glass}
                        onPress={() => {
                          setSelectedGlass(glass);
                          setShowGlassPicker(false);
                        }}
                        style={{
                          padding: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: '#333333',
                          backgroundColor: selectedGlass === glass ? '#007AFF20' : 'transparent'
                        }}>
                        <Text style={{ 
                          color: selectedGlass === glass ? '#007AFF' : '#ffffff', 
                          fontSize: 16
                        }}>
                          {glass}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Venue Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#ffffff', fontSize: 18, marginBottom: 8 }}>
                Additional Venues
              </Text>
              <Text style={{ color: '#666666', fontSize: 14, marginBottom: 12 }}>
                Will be added to {defaultVenue?.name || 'My Speakeasy'} automatically. Select additional venues:
              </Text>
              
              {nonDefaultVenues.length > 0 ? (
                nonDefaultVenues.map((venue) => (
                  <Pressable
                    key={venue.id}
                    onPress={() => toggleVenueSelection(venue.id)}
                    style={{
                      backgroundColor: '#0f0f0f',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#333333'
                    }}>
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: selectedVenues.includes(venue.id) ? '#007AFF' : '#666666',
                      backgroundColor: selectedVenues.includes(venue.id) ? '#007AFF' : 'transparent',
                      marginRight: 12,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      {selectedVenues.includes(venue.id) && (
                        <FontAwesome name="check" size={10} color="#ffffff" />
                      )}
                    </View>
                    <Text style={{ color: '#ffffff', fontSize: 16, flex: 1 }}>
                      {venue.name}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text style={{ color: '#666666', fontSize: 14, fontStyle: 'italic' }}>
                  No additional venues available. Create venues in the Speakeasy tab.
                </Text>
              )}
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? '#666666' : '#007AFF',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                marginBottom: 40
              }}>
              <Text style={{ 
                color: '#ffffff', 
                fontSize: 16
              }}>
                {isSubmitting ? (editCocktail ? 'Updating...' : 'Creating...') : (editCocktail ? 'Update Cocktail' : 'Create Cocktail')}
              </Text>
            </Pressable>
          </ScrollView>
              </Container>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}