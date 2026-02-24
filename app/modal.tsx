import { StatusBar } from 'expo-status-bar';
import { Platform, View, Alert, Pressable, ActivityIndicator, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';

import { Text } from '~/components/nativewindui/Text';
import { useUser } from '~/lib/contexts/UserContext';

export default function Modal() {
  const { clearCustomData, exportUserData, shareExportFile, getExportPreview, importDataFromFile, applyImportedData } = useUser();
  const router = useRouter();
  const [isClearingData, setIsClearingData] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleClearData = async () => {
    Alert.alert(
      'Clear All Data',
      `⚠️ WARNING: This will permanently delete all your custom venues and cocktails.\n\nThis cannot be undone!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            setIsClearingData(true);
            try {
              await clearCustomData();
              Alert.alert('Data Cleared', 'All custom venues and cocktails have been deleted.');
            } catch (error: any) {
              console.error('Clear data failed:', error);
              Alert.alert('Clear Failed', error?.message || 'Failed to clear data.');
            } finally {
              setIsClearingData(false);
            }
          }
        }
      ]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const preview = getExportPreview();
      if (!preview) {
        Alert.alert('Nothing to Export', 'No user data found to export.');
        return;
      }

      const fileUri = await exportUserData();
      await shareExportFile(fileUri);
    } catch (error: any) {
      console.error('Export failed:', error);
      // Don't show error for share sheet cancellation
      if (!error?.message?.includes('cancelled') && !error?.message?.includes('dismissed')) {
        Alert.alert('Export Failed', error?.message || 'Failed to export data. Please try again.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const importData = await importDataFromFile();
      if (!importData) {
        // User cancelled the picker
        return;
      }

      const { metadata } = importData;
      const venueCount = metadata.totalVenues;
      const cocktailCount = metadata.totalCustomCocktails;
      const favoriteCount = metadata.totalFavorites;

      const exportDate = metadata.exportDate
        ? new Date(metadata.exportDate).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
          })
        : 'Unknown date';

      const preview = [
        `From: ${exportDate}`,
        `• ${favoriteCount} favourite${favoriteCount !== 1 ? 's' : ''}`,
        `• ${venueCount} venue${venueCount !== 1 ? 's' : ''}`,
        `• ${cocktailCount} custom cocktail${cocktailCount !== 1 ? 's' : ''}`,
        '',
        'This will ADD to your existing data. Nothing will be deleted.',
      ].join('\n');

      Alert.alert(
        'Import Data?',
        preview,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: async () => {
              try {
                const result = await applyImportedData(importData);
                const summary = [
                  `Favourites: ${result.favorites.imported} added, ${result.favorites.skipped} already existed`,
                  `Venues: ${result.venues.imported} created, ${result.venues.merged} merged`,
                  `Cocktails: ${result.customCocktails.imported} added, ${result.customCocktails.skipped} already existed`,
                ].join('\n');
                Alert.alert('Import Complete', summary);
              } catch (applyError: any) {
                console.error('Apply import failed:', applyError);
                Alert.alert('Import Failed', applyError?.message || 'Failed to apply import data.');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Import failed:', error);
      if (!error?.message?.includes('cancelled')) {
        Alert.alert('Import Failed', error?.message || 'Failed to read import file. Make sure it is a valid BarVibez export.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const isAnyActionRunning = isClearingData || isExporting || isImporting;

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, padding: 20 }}>
          {/* Header with Close Button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#ffffff', fontSize: 24, textAlign: 'center' }}>
                Settings
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              style={{ position: 'absolute', right: 0, padding: 10 }}>
              <FontAwesome name="times" size={24} color="#888888" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Data Backup & Sharing Section */}
            <View style={{
              backgroundColor: '#1a1a1a',
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#333333'
            }}>
              <Text style={{ color: '#ffffff', fontSize: 18, marginBottom: 6 }}>
                Data Backup & Sharing
              </Text>
              <Text style={{ color: '#888888', fontSize: 12, marginBottom: 16 }}>
                Export your venues, cocktails and favourites to a file. Share it with friends or use it to restore your data on a new device.
              </Text>

              {/* Export Button */}
              <Pressable
                onPress={handleExport}
                disabled={isAnyActionRunning}
                style={{
                  backgroundColor: '#1B2D3A',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: '#1D4C6B',
                  marginBottom: 12,
                  opacity: isAnyActionRunning ? 0.6 : 1,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <FontAwesome
                    name="download"
                    size={20}
                    color="#4A90D9"
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#4A90D9', fontSize: 16 }}>
                      {isExporting ? 'Exporting...' : 'Export My Data'}
                    </Text>
                    <Text style={{ color: '#999999', fontSize: 12, marginTop: 2 }}>
                      Save & share your venues, cocktails and favourites
                    </Text>
                  </View>
                </View>
                {isExporting ? (
                  <ActivityIndicator size="small" color="#4A90D9" />
                ) : (
                  <FontAwesome name="chevron-right" size={16} color="#4A90D9" />
                )}
              </Pressable>

              {/* Import Button */}
              <Pressable
                onPress={handleImport}
                disabled={isAnyActionRunning}
                style={{
                  backgroundColor: '#1B2D23',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: '#1D4C2F',
                  opacity: isAnyActionRunning ? 0.6 : 1,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <FontAwesome
                    name="upload"
                    size={20}
                    color="#4ABA6E"
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#4ABA6E', fontSize: 16 }}>
                      {isImporting ? 'Reading file...' : 'Import Data File'}
                    </Text>
                    <Text style={{ color: '#999999', fontSize: 12, marginTop: 2 }}>
                      Add venues, cocktails and favourites from a file
                    </Text>
                  </View>
                </View>
                {isImporting ? (
                  <ActivityIndicator size="small" color="#4ABA6E" />
                ) : (
                  <FontAwesome name="chevron-right" size={16} color="#4ABA6E" />
                )}
              </Pressable>
            </View>

            {/* Data Management Section */}
            <View style={{
              backgroundColor: '#1a1a1a',
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#333333'
            }}>
              <Text style={{ color: '#ffffff', fontSize: 18, marginBottom: 15 }}>
                Data Management
              </Text>

              {/* Clear Data Button */}
              <Pressable
                onPress={handleClearData}
                disabled={isAnyActionRunning}
                style={{
                  backgroundColor: '#2D1B24',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: '#4C1D2F',
                  opacity: isAnyActionRunning ? 0.6 : 1,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome
                    name="trash"
                    size={20}
                    color="#FF6B6B"
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FF6B6B', fontSize: 16 }}>
                      {isClearingData ? 'Clearing...' : 'Clear All Custom Data'}
                    </Text>
                    <Text style={{ color: '#999999', fontSize: 12, marginTop: 2 }}>
                      Permanently delete all custom venues and cocktails
                    </Text>
                  </View>
                </View>
                {isClearingData ? (
                  <ActivityIndicator size="small" color="#FF6B6B" />
                ) : (
                  <FontAwesome name="chevron-right" size={16} color="#FF6B6B" />
                )}
              </Pressable>
            </View>

            {/* Privacy Info */}
            <View style={{
              backgroundColor: '#1a1a1a',
              borderRadius: 12,
              padding: 20,
              borderWidth: 1,
              borderColor: '#333333'
            }}>
              <Text style={{ color: '#888888', fontSize: 14, lineHeight: 20, marginBottom: 12 }}>
                All user data is stored locally on your device. RevenueCat, our subscription provider, maintains subscription-related information for Premium users. For data deletion requests, please contact support@nomadsoft.us or visit the link below and we will submit a case to RevenueCat.
              </Text>
              <Pressable
                onPress={() => Linking.openURL('https://nomadsoft.us/support')}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#007AFF', fontSize: 14, textDecorationLine: 'underline', marginRight: 6 }}>
                  Contact Support
                </Text>
                <FontAwesome name="external-link" size={12} color="#007AFF" />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </>
  );
}
