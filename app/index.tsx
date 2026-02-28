import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Directory, File, Paths } from 'expo-file-system';
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, Alert, ActivityIndicator, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import { useFonts, IndieFlower_400Regular } from '@expo-google-fonts/indie-flower';
import * as SplashScreen from 'expo-splash-screen';
import { FlashList } from "@shopify/flash-list";

// Prevent the splash screen from auto-hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();
const { width } = Dimensions.get('window');
const A4_HEIGHT = width * 1.414;

export default function Index() {
  const router = useRouter();
  const rootDir = Paths.document.uri + "App/";
  const [entries, setEntries] = useState<any[]>([]);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Capture States
  const viewShotRef = useRef<ViewShot>(null);
  const [sharingEntry, setSharingEntry] = useState<any>(null);

  const [fontsLoaded, fontError] = useFonts({
    IndieFlower_400Regular,
  });

  // Handle splash screen hiding
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);


  // --- Directory & Loading Logic (Your Existing Code) ---
  useEffect(() => {
    const setupDir = async () => {
      try {
        const baseDir = new Directory(rootDir);
        if (!baseDir.exists) await baseDir.create({ intermediates: true });
      } catch (error) { console.error("Setup error:", error); }
    };
    setupDir();
  }, []);

  const loadEntries = useCallback(async() => {
    try {
      const dir = new Directory(rootDir);
      const items = dir.list();
      const entryPromises = items
      .filter(i => !(i instanceof Directory))
      .map(async (file) => {
        if(file instanceof File){
          const content = await file.text(); // Non-blocking read
        return { file, json: JSON.parse(content) };
        }
      });
    const parsed = await Promise.all(entryPromises);
    const sorted = parsed.sort((a:any, b:any) => b.json.id - a.json.id);
    setEntries(sorted);
    } catch (e) { console.error("Load error:", e); }
  }, []);

  useEffect(() => { loadEntries(); }, []);
  useFocusEffect(useCallback(() => { loadEntries(); }, []));

  const deleteFile = (file: File) => {
    file.delete();
    loadEntries();
  };

  // --- New Export Logic ---
  const handleExport = async (entry: any, mode: 'share' | 'save') => {
    setSharingEntry(entry); // Trigger the hidden render

    // Give the UI time to render the high-res images before snapping
    setTimeout(async () => {
      try {
        const uri = await viewShotRef.current?.capture?.();
        if (!uri) return;

        if (mode === 'share') {
          await Sharing.shareAsync(uri);
        } else {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') {
            await MediaLibrary.createAssetAsync(uri);
            Alert.alert("Success", "Scrapbook page saved to gallery!");
          }
        }
      } catch (err) {
        Alert.alert("Error", "Failed to export image.");
      } finally {
        setSharingEntry(null); // Clean up
      }
    }, 600); 
  };

const exportAllToPDF = async () => {
  if (entries.length === 0) return;
  setIsExporting(true);
  setExportProgress(0);
  try {
    const base64Images: string[] = [];
    for (let i = 0; i < entries.length; i++) {
      setExportProgress(Math.round(((i + 1) / entries.length) * 100));
      setSharingEntry(entries[i]);
      await new Promise(resolve => setTimeout(resolve, 400)); 
      const uri = await viewShotRef.current?.capture?.();
      if (uri) {
        const base64 = await new File(uri).base64();
        base64Images.push(`data:image/jpeg;base64,${base64}`);
      }
    }
    if (base64Images.length === 0) {
      Alert.alert("No entries", "There are no entries to export.");
      return;
    }

    // 3. Generate HTML with Base64 strings
    const htmlContent = `
      <html>
        <head>
          <style>
            @page { margin: 0; }
            body { margin: 0; padding: 0; background-color: white; }
            img { 
              width: 100%; 
              height: 100vh; 
              display: block; 
              object-fit: contain; 
              page-break-after: always; 
            }
            /* Remove blank page at the end */
            img:last-child { page-break-after: auto; }
          </style>
        </head>
        <body>
          ${base64Images.map(b64 => `<img src="${b64}" />`).join('')}
        </body>
      </html>
    `;

    // 4. Create PDF and Share
    const { uri: pdfUri } = await Print.printToFileAsync({ html: htmlContent });
    //console.log(htmlContent);
    await Sharing.shareAsync(pdfUri, { UTI: '.pdf', mimeType: 'application/pdf' });

  } catch (err) {
    Alert.alert("Error", "Failed to compile PDF.");
    console.error(err);
  } finally {
    setSharingEntry(null);
    setIsExporting(false);
  }
};
  // --- Scrapbook Template Component (Hidden) ---
  const ExportTemplate = ({ item }: { item: any }) => (
    <View style={exportStyles.page}>
      <Text style={exportStyles.dateLabel}>{item.json.date}</Text>
      {/* Spiral Binder */}
      <View style={exportStyles.binder}>
        {[...Array(16)].map((_, i) => (
          <View key={i} style={exportStyles.ringContainer}>
            <View style={exportStyles.hole} /><View style={exportStyles.ring} />
          </View>
        ))}
      </View>
      {/*<View style={exportStyles.tape} />*/}
      {item.json.image ?(
          <View style={exportStyles.polaroid}>
              {item.json.image && <Image source={{ uri: item.json.image }} style={exportStyles.photo} />}
          </View>
      ):(<View></View>)}
      <Text style={exportStyles.handwriting}>{item.json.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.titleText}>Photo Journal</Text>
        <View style={styles.rightActions}>
        <Pressable style={styles.delete} onPress={() => router.push('/addEntry')}>
          <FontAwesome5 name='plus' size={20}  color="#555"/> 
        </Pressable>
        <Pressable style={styles.delete} onPress={() => exportAllToPDF()}>
          <FontAwesome5 name="share-alt" size={20} color="#555" />
        </Pressable>
        </View>
      </View>
     <FlashList
        data={entries}
        //estimatedItemSize={300} // Uncomment this! It's required for performance.
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => ( // <--- Destructure 'item' here
          <View style={styles.card}>
            <Pressable onPress={() => router.push(`/editEntry?path=${encodeURIComponent(item.file.uri)}`)}>
              {/* Access via item.json */}
              {item.json.image && (
                <Image 
                  source={{ uri: item.json.image }} 
                  style={{ width: "100%", height: 200 }} 
                />
              )}
              <Text style={styles.text} numberOfLines={3}>{item.json.text}</Text>
            </Pressable>
            
            <View style={styles.cardFooter}>
              <Text style={styles.date}>{item.json.date}</Text>
              <View style={styles.rightActions}>
                <Pressable style={styles.delete} onPress={() => handleExport(item, 'save')}>
                  <FontAwesome5 name="save" size={20} color="#555" />
                </Pressable>
                <Pressable style={styles.delete} onPress={() => handleExport(item, 'share')}>
                  <FontAwesome5 name="share-alt" size={18} color="#555" />
                </Pressable>
                <Pressable style={styles.delete} onPress={() => deleteFile(item.file)}>
                  <FontAwesome5 name="trash-alt" size={18} color="#ca0a04e4" />
                </Pressable>
              </View> 
            </View>
          </View>
        )}
      />
      {/* HIDDEN RENDERER */}
      {sharingEntry && (
        <View style={{ position: 'absolute', left: -width * 2 }}>
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1 }}>
            <ExportTemplate item={sharingEntry} />
          </ViewShot>
        </View>
      )}
      <Modal transparent visible={isExporting} animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#555" />
            <Text style={styles.loadingText}>Generating PDF...</Text>
            <Text style={styles.progressText}>{exportProgress}%</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- Styles ---
const exportStyles = StyleSheet.create({
  page: { width: width, height: A4_HEIGHT, backgroundColor: '#FDF5E6', padding: 30, paddingLeft: 60 },
  binder: { position: 'absolute', left: 15, top: 40, bottom: 40, justifyContent: 'space-between' },
  ringContainer: { height: 20, justifyContent: 'center' },
  hole: { width: 8, height: 10, borderRadius: 5, backgroundColor: '#d1ccc0' },
  ring: { width: 16, height: 5, backgroundColor: '#bdc3c7', position: 'absolute', left: -5, borderRadius: 10 },
  tape: { width: 80, height: 30, backgroundColor: 'rgba(173, 216, 230, 0.4)', alignSelf: 'center', transform: [{ rotate: '-10deg' }], marginBottom: -15, zIndex: 5 },
  polaroid: { backgroundColor: 'white', padding: 8, paddingBottom: 16, elevation: 5, shadowOpacity: 0.2, transform: [{ rotate: '2deg' }] },
  photo: { width: '100%', height: 180 },
  dateLabel: { position: 'absolute', top: 10, right: 10, fontFamily: 'IndieFlower_400Regular', fontSize: 16,color: '#222', 
    textShadowColor: 'rgba(0, 0, 0, 0.3)',textShadowOffset: { width: 0.5, height: 0.5 },textShadowRadius: 1, },
  handwriting: { fontFamily: 'IndieFlower_400Regular', fontSize: 14, marginTop: 20, lineHeight: 15, color: '#2c3e50' }
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },
  titleRow: { flexDirection: "row", padding: 20, justifyContent: "space-between", alignItems: "center" },
  titleText: { fontSize: 22, fontWeight: "bold",color:'#000' },
  card: { width: "92%", borderRadius: 16, marginVertical: 10, marginHorizontal: "4%", backgroundColor: "#fff", elevation: 3, overflow: 'hidden' },
  text: { fontSize: 15, padding: 15, color: "#444" },
  date: { fontSize: 13, padding: 15, color: "#888" },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rightActions: { flexDirection: 'row' },
  delete: { padding: 15 },
  loadingOverlay: {flex: 1,backgroundColor: 'rgba(0,0,0,0.5)',justifyContent: 'center',alignItems: 'center',},
  loadingBox: {backgroundColor: 'white',padding: 30,borderRadius: 20,alignItems: 'center',elevation: 10,
      shadowColor: '#000',shadowOffset: { width: 0, height: 2 },shadowOpacity: 0.25,shadowRadius: 3.84,},
  loadingText: {marginTop: 15,fontSize: 16,fontWeight: '600',color: '#333',},
  progressText: {marginTop: 5,fontSize: 14,color: '#888',},
});